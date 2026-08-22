import { Injectable, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';

@Injectable()
export class TelegramUiService {
  private readonly logger = new Logger(TelegramUiService.name);

  /**
   * Helper that executes an asynchronous action while maintaining a continuous
   * Telegram 'typing' status action (refreshed every 4 seconds) so the user
   * always sees that the bot is actively processing.
   */
  public async withTyping<T>(ctx: Context, action: () => Promise<T>): Promise<T> {
    ctx.sendChatAction('typing').catch(() => {});

    const interval = setInterval(() => {
      ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
      return await action();
    } finally {
      clearInterval(interval);
    }
  }

  /**
   * Removes any persistent reply keyboard from the user's screen
   */
  public getRemoveKeyboard() {
    return Markup.removeKeyboard();
  }

  /**
   * Builds clean Inline Keyboard attached directly under start / help messages
   */
  public buildMainMenuInlineMarkup(isAdmin = false, isGoogleConnected = false, authUrl = '') {
    if (!isGoogleConnected && authUrl) {
      return Markup.inlineKeyboard([[Markup.button.url('🔗 Đăng Nhập Google Ngay', authUrl)]]);
    }

    const rows = [
      [
        Markup.button.callback('📅 Lịch Hôm Nay', 'action:refresh_today'),
        Markup.button.callback('📝 Việc Cần Làm', 'action:view_tasks'),
      ],
      [
        Markup.button.callback('📊 Xem 7 Ngày Tới', 'action:view_week'),
        Markup.button.callback('⚙️ Trạng Thái', 'action:refresh_status'),
      ],
    ];

    if (isAdmin) {
      rows.push([
        Markup.button.callback('👥 Danh Sách User', 'action:refresh_users'),
        Markup.button.callback('🎟️ Tạo Link Mời', 'action:create_invite'),
      ]);
    }

    return Markup.inlineKeyboard(rows);
  }

  /**
   * Builds interactive Inline Keyboards for to-do list tasks
   * allowing users to click a single button to complete each task!
   */
  public buildTaskChecklistMarkup(tasks: Array<{ id?: string | null; title?: string | null }>) {
    const validTasks = tasks.filter((t) => t.id && t.title);
    if (validTasks.length === 0) return undefined;

    const inlineButtons = validTasks.slice(0, 8).map((t, idx) => {
      const cleanTitle = (t.title || 'Task').trim();
      const shortTitle = cleanTitle.length > 22 ? `${cleanTitle.slice(0, 20)}...` : cleanTitle;
      return [
        Markup.button.callback(`✅ Xong #${idx + 1}: ${shortTitle}`, `complete_task:${t.id}`),
      ];
    });

    return Markup.inlineKeyboard(inlineButtons);
  }

  /**
   * Builds interactive buttons for today summary
   */
  public buildTodayActionsMarkup() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Cập nhật lại', 'action:refresh_today'),
        Markup.button.callback('📝 Xem việc cần làm', 'action:view_tasks'),
      ],
    ]);
  }

  /**
   * Builds interactive action buttons for Admin user list
   */
  public buildAdminUsersMarkup() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🎟️ Tạo Link Mời Mới', 'action:create_invite'),
        Markup.button.callback('🔄 Làm mới danh sách', 'action:refresh_users'),
      ],
    ]);
  }

  /**
   * Builds interactive buttons attached under a newly created reminder
   * allowing the user to switch between TextMe / CallMe or Cancel the reminder.
   */
  public buildReminderConfirmationMarkup(
    reminderId: string,
    currentNotifyType: 'text' | 'call' = 'text',
  ) {
    const isCall = currentNotifyType === 'call';
    const switchBtn = isCall
      ? Markup.button.callback(
          '💬 Đổi Sang Nhắn Tin (TextMe)',
          `switch_reminder:text:${reminderId}`,
        )
      : Markup.button.callback(
          '📞 Đổi Sang Gọi Nhá Máy (CallMe)',
          `switch_reminder:call:${reminderId}`,
        );

    return Markup.inlineKeyboard([
      [switchBtn],
      [
        Markup.button.callback('❌ Hủy Lời Nhắc', `cancel_reminder:${reminderId}`),
        Markup.button.callback('🆗 Đã Hiểu (Ẩn Nút)', `dismiss_buttons:${reminderId}`),
      ],
    ]);
  }

  /**
   * Builds interactive buttons attached under a newly created Google Calendar event
   */
  public buildCalendarConfirmationMarkup(eventId?: string, htmlLink?: string) {
    const buttons = [];
    if (htmlLink) {
      buttons.push([Markup.button.url('📅 Mở Trên Google Calendar', htmlLink)]);
    }
    const actionRow = [];
    if (eventId) {
      actionRow.push(Markup.button.callback('🗑️ Xóa Lịch Hẹn', `delete_calendar_event:${eventId}`));
    }
    actionRow.push(
      Markup.button.callback('🆗 Đã Hiểu (Ẩn Nút)', `dismiss_buttons:${eventId || 'cal'}`),
    );
    buttons.push(actionRow);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Safely sends replies with automatic chunking for long messages (>4000 chars),
   * fallback to plain text if Telegram Markdown parsing fails, and optional markup.
   */
  public async sendSafeReply(
    ctx: Context,
    text: string,
    extraMarkup?: ReturnType<typeof Markup.inlineKeyboard> | ReturnType<typeof Markup.keyboard>,
  ): Promise<void> {
    const MAX_LENGTH = 4000;
    const chunks: string[] = [];

    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }
      let chunk = remaining.slice(0, MAX_LENGTH);
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > 0) {
        chunk = remaining.slice(0, lastNewline);
        remaining = remaining.slice(lastNewline + 1);
      } else {
        remaining = remaining.slice(MAX_LENGTH);
      }
      chunks.push(chunk);
    }

    for (let i = 0; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const chunk = chunks[i];
      const markupToSend = isLastChunk ? extraMarkup : undefined;

      try {
        if (markupToSend) {
          await ctx.reply(chunk, { parse_mode: 'Markdown', ...markupToSend });
        } else {
          await ctx.reply(chunk, { parse_mode: 'Markdown', ...this.getRemoveKeyboard() });
        }
      } catch (markdownError) {
        const err = markdownError as Error;
        this.logger.warn(`Markdown reply failed, falling back to plain text: ${err.message}`);
        if (markupToSend) {
          await ctx.reply(chunk, markupToSend);
        } else {
          await ctx.reply(chunk, this.getRemoveKeyboard());
        }
      }
    }
  }

  /**
   * Automatically extracts authorization code from either a full redirect callback URL
   * or a raw code string.
   */
  public extractAuthCode(input: string): string {
    let cleaned = input.trim();
    if (cleaned.includes('code=')) {
      try {
        const urlToParse = cleaned.startsWith('http') ? cleaned : `http://localhost/${cleaned}`;
        const parsed = new URL(urlToParse);
        const code = parsed.searchParams.get('code');
        if (code) return code.trim();
      } catch {
        const match = cleaned.match(/code=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]).trim();
      }
    }
    // Remove command prefix e.g. /code
    cleaned = cleaned.replace(/^\/code\s*/i, '').trim();
    return cleaned;
  }
}
