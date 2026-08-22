import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { GoogleModule } from './google/google.module';
import { GeminiModule } from './gemini/gemini.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    GoogleModule,
    GeminiModule,
    TelegramModule,
  ],
})
export class AppModule {}
