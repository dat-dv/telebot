import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context, Markup } from 'telegraf';
import { RemindersService } from './reminders.service';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly remindersService: RemindersService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleCron(): Promise<void> {
    try {
      const dueReminders = await this.remindersService.getDueReminders();
      if (dueReminders.length === 0) return;

      this.logger.log(`Found ${dueReminders.length} due reminder(s) to notify.`);

      for (const reminder of dueReminders) {
        const userId = Number(reminder.userId);
        if (!userId || isNaN(userId)) continue;

        const timeStr = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          weekday: 'short',
        }).format(new Date(reminder.remindAt));

        const reminderMessage = `⏰ *TING TING! LỜI NHẮC CỦA BẠN ĐÃ ĐẾN GIỜ!*
━━━━━━━━━━━━━━━━━━━━
📌 *Nội dung*: *${reminder.title}*
⏰ *Thời điểm*: ${timeStr}
━━━━━━━━━━━━━━━━━━━━
👉 Bạn có thể đánh dấu đã làm xong hoặc hoãn lại 15 phút bên dưới:`;

        const actionKeyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Đã Xong', `done_reminder:${reminder.id}`),
            Markup.button.callback('⏳ Nhắc Lại 15 Phút', `snooze_reminder:15:${reminder.id}`),
          ],
        ]);

        try {
          await this.bot.telegram.sendMessage(userId, reminderMessage, {
            parse_mode: 'Markdown',
            ...actionKeyboard,
          });
          await this.remindersService.markTriggered(reminder.id);
          this.logger.log(
            `Successfully sent proactive reminder "${reminder.title}" to user ${userId}`,
          );
        } catch (tgErr) {
          const err = tgErr as Error;
          this.logger.error(`Failed to send reminder message to user ${userId}: ${err.message}`);
        }
      }
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error in ReminderSchedulerService: ${error.message}`);
    }
  }
}
