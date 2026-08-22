import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReminderEntity } from '../database/entities/reminder.entity';

export interface CreateReminderDto {
  userId: number;
  title: string;
  remindAt: Date;
  repeatType?: 'none' | 'daily' | 'weekly';
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(ReminderEntity)
    private readonly reminderRepo: Repository<ReminderEntity>,
  ) {}

  public async createReminder(dto: CreateReminderDto): Promise<ReminderEntity> {
    const reminder = this.reminderRepo.create({
      userId: dto.userId.toString(),
      title: dto.title.trim(),
      remindAt: dto.remindAt,
      repeatType: dto.repeatType || 'none',
      isTriggered: false,
    });

    const saved = await this.reminderRepo.save(reminder);
    this.logger.log(
      `Created reminder "${dto.title}" for user ${dto.userId} at ${dto.remindAt.toISOString()}`,
    );
    return saved;
  }

  public async getDueReminders(): Promise<ReminderEntity[]> {
    const now = new Date();
    return this.reminderRepo.find({
      where: {
        remindAt: LessThanOrEqual(now),
        isTriggered: false,
      },
    });
  }

  public async getUserUpcomingReminders(userId: number): Promise<ReminderEntity[]> {
    return this.reminderRepo.find({
      where: {
        userId: userId.toString(),
        isTriggered: false,
      },
      order: {
        remindAt: 'ASC',
      },
    });
  }

  public async markTriggered(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findOne({ where: { id: reminderId } });
    if (!reminder) return;

    if (reminder.repeatType === 'daily') {
      const nextDay = new Date(reminder.remindAt.getTime() + 24 * 60 * 60 * 1000);
      reminder.remindAt = nextDay;
      reminder.isTriggered = false;
      await this.reminderRepo.save(reminder);
      this.logger.log(
        `Rescheduled daily reminder "${reminder.title}" for ${nextDay.toISOString()}`,
      );
    } else if (reminder.repeatType === 'weekly') {
      const nextWeek = new Date(reminder.remindAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      reminder.remindAt = nextWeek;
      reminder.isTriggered = false;
      await this.reminderRepo.save(reminder);
      this.logger.log(
        `Rescheduled weekly reminder "${reminder.title}" for ${nextWeek.toISOString()}`,
      );
    } else {
      reminder.isTriggered = true;
      await this.reminderRepo.save(reminder);
    }
  }

  public async snoozeReminder(reminderId: string, minutes = 15): Promise<ReminderEntity | null> {
    const reminder = await this.reminderRepo.findOne({ where: { id: reminderId } });
    if (!reminder) return null;

    const newTime = new Date(Date.now() + minutes * 60 * 1000);
    reminder.remindAt = newTime;
    reminder.isTriggered = false;
    const saved = await this.reminderRepo.save(reminder);

    this.logger.log(
      `Snoozed reminder "${reminder.title}" for ${minutes} minutes (until ${newTime.toISOString()})`,
    );
    return saved;
  }

  public async deleteReminder(reminderId: string, userId?: number): Promise<boolean> {
    const whereCondition: Record<string, unknown> = { id: reminderId };
    if (userId) {
      whereCondition.userId = userId.toString();
    }

    const reminder = await this.reminderRepo.findOne({ where: whereCondition });
    if (!reminder) return false;

    await this.reminderRepo.remove(reminder);
    this.logger.log(`Deleted reminder "${reminder.title}" (${reminderId})`);
    return true;
  }
}
