import { Module } from '@nestjs/common';
import { ReceiptImageStorageService } from './receipt-image-storage.service';

@Module({
  providers: [ReceiptImageStorageService],
  exports: [ReceiptImageStorageService],
})
export class ReceiptStorageModule {}
