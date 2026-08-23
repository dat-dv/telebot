import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegram } from 'telegraf';
import { createWorker } from 'tesseract.js';
import { GeminiService, ReceiptImageAnalysis } from '../../gemini/gemini.service';

interface TelegramPhoto {
  file_id: string;
  file_size?: number;
}

export function normalizeOcrText(value: string): string {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 12_000);
}

@Injectable()
export class ReceiptImageAnalysisService {
  private readonly maxBytes: number;
  private readonly timeoutMs: number;
  private readonly langPath: string;
  private workerPromise?: ReturnType<typeof createWorker>;

  constructor(
    configService: ConfigService,
    private readonly geminiService: GeminiService,
  ) {
    this.maxBytes = configService.get<number>('receiptImage.maxBytes', 10 * 1024 * 1024);
    this.timeoutMs = configService.get<number>('receiptImage.timeoutMs', 45_000);
    this.langPath = configService.get<string>('receiptImage.langPath', '/app/assets/tessdata');
  }

  public async analyze(telegram: Telegram, photos: TelegramPhoto[]): Promise<ReceiptImageAnalysis> {
    const photo = photos[photos.length - 1];
    if (!photo) throw new Error('Không tìm thấy ảnh để phân tích.');
    if (photo.file_size && photo.file_size > this.maxBytes) {
      throw new Error('Ảnh quá lớn. Vui lòng gửi ảnh dưới 10 MB.');
    }

    const fileUrl = await telegram.getFileLink(photo.file_id);
    const response = await fetch(fileUrl, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error('Không tải được ảnh từ Telegram.');

    const image = Buffer.from(await response.arrayBuffer());
    if (image.length === 0 || image.length > this.maxBytes) {
      throw new Error('Ảnh không hợp lệ hoặc vượt quá giới hạn 10 MB.');
    }
    const worker = await this.getWorker();
    const result = await worker.recognize(image);
    const ocrText = normalizeOcrText(result.data.text);
    if (!ocrText) throw new Error('Không đọc được chữ trong ảnh. Vui lòng gửi ảnh rõ hơn.');
    return this.geminiService.analyzeReceiptText(ocrText);
  }

  private async getWorker() {
    if (this.workerPromise === undefined) {
      this.workerPromise = createWorker(['vie', 'eng'], undefined, {
        langPath: this.langPath,
        cacheMethod: 'none',
        gzip: true,
      });
    }
    return this.workerPromise;
  }
}
