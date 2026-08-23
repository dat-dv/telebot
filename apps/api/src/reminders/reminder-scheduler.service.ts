import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context, Markup } from 'telegraf';
import { RemindersService } from './reminders.service';
import { TelegramCallerService } from './telegram-caller.service';
import { UsersService } from '../users/users.service';
import { localeTag, translate } from '@telebot/contracts';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly remindersService: RemindersService,
    private readonly callerService: TelegramCallerService,
    private readonly usersService: UsersService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleCron(): Promise<void> {
    try {
      const dueReminders = await this.remindersService.getDueReminders();
      if (dueReminders.length === 0) return;

      this.logger.log(`Found ${dueReminders.length} due reminder(s) to process.`);

      for (const reminder of dueReminders) {
        const userId = Number(reminder.userId);
        if (!userId || isNaN(userId)) continue;

        const locale = await this.usersService.getPreferredLocale(userId);
        const timeStr = new Intl.DateTimeFormat(localeTag(locale), {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          weekday: 'short',
        }).format(new Date(reminder.remindAt));

        // 1. If notifyType is 'call', execute GramJS Flash Call first
        if (reminder.notifyType === 'call') {
          if (this.callerService.isAvailable()) {
            this.logger.log(
              `Triggering GramJS Flash Call for reminder "${reminder.title}" to user ${userId}`,
            );
            // Fire flash call in background (rings for 12 seconds)
            this.callerService.makeFlashCall(userId, 12000).catch((callErr) => {
              const err = callErr as Error;
              this.logger.warn(`Flash Call failed: ${err.message}`);
            });
          } else {
            this.logger.log(
              `GramJS not connected, sending text notification instead for call reminder "${reminder.title}".`,
            );
          }
        }

        // 2. Send Telegram rich message with action buttons
        const isCallMode = reminder.notifyType === 'call';
        const reminderHeader = translate(
          locale,
          isCallMode ? 'reminder.header.call' : 'reminder.header.text',
        );

        const reminderMessage = `${reminderHeader}
━━━━━━━━━━━━━━━━━━━━
📌 *Nội dung*: *${reminder.title}*
⏰ *Thời điểm*: ${timeStr}
${isCallMode ? '📞 *Hình thức*: Gọi đổ chuông Telegram (CallMe)\n' : ''}━━━━━━━━━━━━━━━━━━━━
👉 Bạn có thể đánh dấu đã làm xong hoặc hoãn lại 15 phút bên dưới:`;

        const actionKeyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(
              translate(locale, 'reminder.done'),
              `done_reminder:${reminder.id}`,
            ),
          ],
          [
            Markup.button.callback(
              translate(locale, 'reminder.snooze'),
              `snooze_reminder:15:${reminder.id}`,
            ),
          ],
        ]);

        try {
          await this.bot.telegram.sendMessage(userId, reminderMessage, {
            parse_mode: 'Markdown',
            ...actionKeyboard,
          });
          await this.remindersService.markTriggered(reminder.id);
          this.logger.log(
            `Successfully processed reminder "${reminder.title}" [${reminder.notifyType.toUpperCase()}] for user ${userId}`,
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
