import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Telegram } from 'telegraf';

interface TelegramVoice {
  file_id: string;
  duration: number;
  file_size?: number;
}

interface PendingVoiceRequest {
  transcript: string;
  userId: number;
  expiresAt: number;
}

@Injectable()
export class VoiceTranscriptionService {
  private readonly logger = new Logger(VoiceTranscriptionService.name);
  private readonly pendingRequests = new Map<string, PendingVoiceRequest>();
  private readonly whisperUrl: string;
  private readonly timeoutMs: number;
  private readonly maxDurationSeconds: number;
  private readonly maxBytes: number;

  constructor(private readonly configService: ConfigService) {
    this.whisperUrl = this.configService.get<string>('voice.whisperUrl', 'http://127.0.0.1:8080');
    this.timeoutMs = this.configService.get<number>('voice.timeoutMs', 45_000);
    this.maxDurationSeconds = this.configService.get<number>('voice.maxDurationSeconds', 90);
    this.maxBytes = this.configService.get<number>('voice.maxBytes', 8 * 1024 * 1024);
  }

  public async transcribe(telegram: Telegram, voice: TelegramVoice): Promise<string> {
    if (voice.duration > this.maxDurationSeconds) {
      throw new Error(
        `Voice dài quá ${this.maxDurationSeconds} giây. Vui lòng gửi voice ngắn hơn.`,
      );
    }
    if (voice.file_size && voice.file_size > this.maxBytes) {
      throw new Error('File voice quá lớn. Vui lòng gửi lại một voice ngắn hơn.');
    }

    const fileUrl = await telegram.getFileLink(voice.file_id);
    const fileResponse = await fetch(fileUrl, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!fileResponse.ok) throw new Error('Không tải được voice từ Telegram.');

    const audio = Buffer.from(await fileResponse.arrayBuffer());
    if (audio.length === 0 || audio.length > this.maxBytes) {
      throw new Error('File voice không hợp lệ hoặc vượt giới hạn dung lượng.');
    }

    const form = new FormData();
    form.set('file', new Blob([audio], { type: 'audio/ogg' }), 'telegram-voice.ogg');
    form.set('language', 'vi');
    form.set('temperature', '0.0');
    form.set('response_format', 'json');

    let response: Response;
    try {
      response = await fetch(`${this.whisperUrl.replace(/\/$/, '')}/inference`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.error(`Whisper request failed: ${(error as Error).message}`);
      throw new Error('Dịch vụ nhận diện giọng nói hiện chưa sẵn sàng. Vui lòng thử lại sau.');
    }

    if (!response.ok) {
      this.logger.warn(`Whisper returned ${response.status}`);
      throw new Error('Không thể nhận dạng voice này. Hãy thử ghi rõ hơn hoặc gửi text.');
    }

    const payload: unknown = await response.json();
    const transcript = this.extractTranscript(payload);
    if (!transcript) throw new Error('Không nghe được nội dung trong voice. Vui lòng thử lại.');
    return transcript;
  }

  public queueTranscript(userId: number, transcript: string): string {
    const id = randomUUID();
    this.pendingRequests.set(id, { transcript, userId, expiresAt: Date.now() + 10 * 60 * 1000 });
    return id;
  }

  public consumeTranscript(id: string, userId: number): string {
    const pending = this.pendingRequests.get(id);
    this.pendingRequests.delete(id);
    if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
      throw new Error('Yêu cầu voice không còn hiệu lực. Hãy gửi lại voice.');
    }
    return pending.transcript;
  }

  public cancelTranscript(id: string, userId: number): boolean {
    const pending = this.pendingRequests.get(id);
    if (!pending || pending.userId !== userId) return false;
    this.pendingRequests.delete(id);
    return true;
  }

  private extractTranscript(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return '';
    const candidate = payload as { text?: unknown };
    return typeof candidate.text === 'string' ? candidate.text.replace(/\s+/g, ' ').trim() : '';
  }
}
