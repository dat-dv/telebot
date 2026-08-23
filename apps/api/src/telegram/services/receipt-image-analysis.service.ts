import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegram } from 'telegraf';
import { GeminiService, ReceiptImageAnalysis } from '../../gemini/gemini.service';

interface TelegramPhoto {
  file_id: string;
  file_size?: number;
}

@Injectable()
export class ReceiptImageAnalysisService {
  private readonly maxBytes: number;
  private readonly timeoutMs: number;

  constructor(
    configService: ConfigService,
    private readonly geminiService: GeminiService,
  ) {
    this.maxBytes = configService.get<number>('receiptImage.maxBytes', 10 * 1024 * 1024);
    this.timeoutMs = configService.get<number>('receiptImage.timeoutMs', 45_000);
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
    return this.geminiService.analyzeReceiptImage(image, 'image/jpeg');
  }
}
