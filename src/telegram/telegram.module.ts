import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram.update';
import { TelegramUiService } from './services/telegram-ui.service';
import { AuthGuard } from './guards/auth.guard';
import { GeminiModule } from '../gemini/gemini.module';
import { GoogleModule } from '../google/google.module';
import { UsersModule } from '../users/users.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('telegram.token');
        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables.');
        }
        return {
          token,
        };
      },
      inject: [ConfigService],
    }),
    GeminiModule,
    GoogleModule,
    UsersModule,
    RemindersModule,
  ],
  providers: [TelegramUpdate, TelegramUiService, AuthGuard],
  exports: [TelegramUiService],
})
export class TelegramModule {}
