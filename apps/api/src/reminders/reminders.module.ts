import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEntity } from '../database/entities/reminder.entity';
import { RemindersService } from './reminders.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { TelegramCallerService } from './telegram-caller.service';
import { RemindersController } from './reminders.controller';
import { DashboardAuthModule } from '../dashboard-auth/dashboard-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEntity]), DashboardAuthModule],
  controllers: [RemindersController],
  providers: [RemindersService, ReminderSchedulerService, TelegramCallerService],
  exports: [RemindersService, TelegramCallerService],
})
export class RemindersModule {}
