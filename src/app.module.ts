import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { GoogleModule } from './google/google.module';
import { GeminiModule } from './gemini/gemini.module';
import { TelegramModule } from './telegram/telegram.module';
import { RemindersModule } from './reminders/reminders.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    GoogleModule,
    RemindersModule,
    FinanceModule,
    GeminiModule,
    TelegramModule,
  ],
})
export class AppModule {}
