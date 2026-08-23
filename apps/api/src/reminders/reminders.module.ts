import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEntity } from '../database/entities/reminder.entity';
import { RemindersService } from './reminders.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { TelegramCallerService } from './telegram-caller.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEntity])],
  providers: [RemindersService, ReminderSchedulerService, TelegramCallerService],
  exports: [RemindersService, TelegramCallerService],
})
export class RemindersModule {}
