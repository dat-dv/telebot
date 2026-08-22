import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEntity } from '../database/entities/reminder.entity';
import { RemindersService } from './reminders.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEntity])],
  providers: [RemindersService, ReminderSchedulerService],
  exports: [RemindersService],
})
export class RemindersModule {}
