import { Injectable, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { getQuickMenuItems, getTelegramCommands } from '../telegram-menu.catalog';
import { DEFAULT_LOCALE, type SupportedLocale, translate } from '@telebot/contracts';

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

    const buttons: Array<ReturnType<typeof Markup.button.callback>> = [];
    for (const item of getQuickMenuItems(isAdmin)) {
      if (item.opensDashboard) {
        buttons.push(Markup.button.callback(item.label, 'action:view_reports'));
        continue;
      }
      if (item.callbackData) buttons.push(Markup.button.callback(item.label, item.callbackData));
    }

    return Markup.inlineKeyboard(this.groupButtons(buttons, 2));
  }

  public async syncCommandMenu(
    ctx: Context,
    isAdmin: boolean,
    locale: SupportedLocale = 'vi',
  ): Promise<void> {
    if (!ctx.chat) return;

    try {
      await ctx.telegram.setMyCommands(getTelegramCommands(isAdmin, locale), {
        scope: { type: 'chat', chat_id: ctx.chat.id },
      });
    } catch (error) {
      this.logger.warn(`Unable to sync Telegram command menu: ${String(error)}`);
    }
  }

  public buildLanguageMarkup(locale: SupportedLocale = DEFAULT_LOCALE) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(translate(locale, 'web.language.vi'), 'locale:vi'),
        Markup.button.callback(translate(locale, 'web.language.en'), 'locale:en'),
      ],
    ]);
  }

  /**
   * Builds interactive Inline Keyboards for to-do list tasks
   * allowing users to click a single button to complete each task!
   */
  public buildTaskChecklistMarkup(tasks: Array<{ id?: string | null; title?: string | null }>) {
    const validTasks = tasks.filter((t) => t.id && t.title);
    if (validTasks.length === 0) return undefined;

    const buttons = validTasks
      .slice(0, 8)
      .map((task, index) => Markup.button.callback(`✅ #${index + 1}`, `complete_task:${task.id}`));
    const inlineButtons = buttons.reduce<Array<(typeof buttons)[number][]>>(
      (rows, button, index) => {
        if (index % 2 === 0) rows.push([button]);
        else rows[rows.length - 1].push(button);
        return rows;
      },
      [],
    );
    inlineButtons.push([Markup.button.callback('❌ Đóng', 'message:close')]);

    return Markup.inlineKeyboard(inlineButtons);
  }

  /**
   * Builds interactive buttons for today summary
   */
  public buildTodayActionsMarkup() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Cập nhật lịch hôm nay', 'action:refresh_today')],
      [Markup.button.callback('📝 Việc cần làm', 'action:view_tasks')],
      [Markup.button.callback('❌ Đóng', 'message:close')],
    ]);
  }

  public buildWeekActionsMarkup() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Cập nhật lịch 7 ngày', 'action:refresh_week')],
      [Markup.button.callback('📝 Việc cần làm', 'action:view_tasks')],
      [Markup.button.callback('❌ Đóng', 'message:close')],
    ]);
  }

  public buildDebtActionsMarkup(debtId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('💵 Trả nợ', `debt:pay:${debtId}`)],
      [Markup.button.callback('🗑️ Xóa khoản này', `debt:delete:${debtId}`)],
      [Markup.button.callback('❌ Đóng', 'debt:close')],
    ]);
  }

  public buildConfirmationMarkup(actionId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Xác nhận', `confirm:${actionId}`),
        Markup.button.callback('❌ Hủy', `cancel:${actionId}`),
      ],
    ]);
  }

  public buildVoiceConfirmationMarkup(requestId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Xác nhận', `voice:confirm:${requestId}`)],
      [Markup.button.callback('✏️ Sửa bằng text', `voice:edit:${requestId}`)],
      [Markup.button.callback('❌ Hủy', `voice:cancel:${requestId}`)],
    ]);
  }

  public formatVoiceConfirmation(transcript: string): string {
    return `🎙️ <b>BẠN YÊU CẦU</b>\n\n<blockquote>${this.escapeHtml(transcript)}</blockquote>\n\nKiểm tra nội dung trước khi gửi cho trợ lý.`;
  }

  public formatConfirmationBox(
    name: string,
    payload: Record<string, unknown>,
    referenceId: string,
  ): string {
    if (name === 'create_finance_transaction') {
      const type = payload.type === 'income' ? 'Khoản thu' : 'Khoản chi';
      const amount =
        typeof payload.amount === 'number' ? this.formatMoney(payload.amount) : 'Chưa rõ';
      const category = typeof payload.category === 'string' ? payload.category : 'Khác';
      const note = typeof payload.note === 'string' ? payload.note : 'Chưa có mô tả';
      return `⚠️ <b>XÁC NHẬN THU–CHI</b>\n\n<b>${this.escapeHtml(type)}</b>\n💵 ${this.escapeHtml(amount)}\n🏷️ ${this.escapeHtml(category)}\n📝 ${this.escapeHtml(note)}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để ghi sổ.`;
    }
    if (name === 'create_task' || name === 'create_tasks') {
      const tasks =
        name === 'create_task'
          ? [payload]
          : Array.isArray(payload.tasks)
            ? payload.tasks.filter(
                (task): task is Record<string, unknown> =>
                  Boolean(task) && typeof task === 'object',
              )
            : [];
      const taskLines = tasks.map((task, index) => {
        const title = typeof task.title === 'string' ? task.title : 'Chưa rõ';
        const notes = typeof task.notes === 'string' && task.notes.trim() ? ` — ${task.notes}` : '';
        return `${index + 1}. <b>${this.escapeHtml(title)}</b>${this.escapeHtml(notes)}`;
      });
      const warnings = Array.isArray(payload.duplicateWarnings)
        ? (payload.duplicateWarnings as Array<Record<string, unknown>>)
        : [];
      const warningText = warnings
        .map((warning) => {
          const requestedTitle =
            typeof warning.requestedTitle === 'string' ? warning.requestedTitle : 'Việc này';
          const matches = Array.isArray(warning.matches)
            ? warning.matches
                .map((match) => {
                  if (!match || typeof match !== 'object') return '';
                  const title = (match as Record<string, unknown>).title;
                  return typeof title === 'string' ? `• ${this.escapeHtml(title)}` : '';
                })
                .filter(Boolean)
                .join('\n')
            : '';
          return matches
            ? `⚠️ <b>Có thể trùng:</b> ${this.escapeHtml(requestedTitle)}\n${matches}`
            : '';
        })
        .filter(Boolean)
        .join('\n\n');
      return `⚠️ <b>XÁC NHẬN THÊM VIỆC</b>\n\n${taskLines.join('\n')}${warningText ? `\n\n${warningText}\n\nBạn vẫn có thể xác nhận nếu đây là các việc riêng.` : ''}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để thêm.`;
    }
    return `⚠️ <b>XÁC NHẬN THAO TÁC</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nThao tác: <code>${this.escapeHtml(name)}</code>\n<pre>${this.escapeHtml(JSON.stringify(payload, null, 2))}</pre>\nKiểm tra rồi bấm Xác nhận.`;
  }

  public formatResultBox(
    name: string,
    result: Record<string, unknown>,
    referenceId: string,
    cancelled = false,
  ): string {
    if (cancelled) return '❌ Đã hủy thao tác.';
    if (result.success !== true) {
      const error =
        typeof result.error === 'string' ? result.error : 'Thao tác chưa thực hiện được.';
      return `⚠️ <b>Chưa thực hiện được</b>\n${this.escapeHtml(error)}`;
    }

    if (name === 'create_task') {
      const task = result.task as Record<string, unknown> | undefined;
      const title = typeof task?.title === 'string' ? task.title : 'Công việc mới';
      return `✅ <b>Đã thêm việc</b> · ${this.escapeHtml(title)}`;
    }
    if (name === 'create_tasks') {
      const created: unknown[] = Array.isArray(result.created) ? result.created : [];
      const titles = created
        .slice(0, 3)
        .map((task): string => {
          if (!task || typeof task !== 'object') return '';
          const title = (task as Record<string, unknown>).title;
          return typeof title === 'string' ? title : '';
        })
        .filter((title): title is string => Boolean(title));
      const remaining = created.length - titles.length;
      const details =
        titles.length > 0 ? `: ${titles.join(' · ')}${remaining > 0 ? ` +${remaining}` : ''}` : '';
      return `✅ <b>Đã thêm ${created.length} việc</b>${this.escapeHtml(details)}`;
    }
    if (name === 'complete_task') {
      const task = result.task as Record<string, unknown> | undefined;
      const title = typeof task?.title === 'string' ? ` · ${task.title}` : '';
      return `✅ <b>Đã hoàn thành</b>${this.escapeHtml(title)}`;
    }
    if (name === 'create_calendar_event') {
      const event = result.event as Record<string, unknown> | undefined;
      const summary = typeof event?.summary === 'string' ? event.summary : 'Lịch hẹn';
      return `✅ <b>Đã tạo lịch</b> · ${this.escapeHtml(summary)}`;
    }
    if (name === 'create_reminder') {
      const title = typeof result.title === 'string' ? result.title : 'Lời nhắc';
      const time = typeof result.formattedTime === 'string' ? ` · ${result.formattedTime}` : '';
      return `✅ <b>Đã cài nhắc</b> · ${this.escapeHtml(title)}${this.escapeHtml(time)}`;
    }

    const message = typeof result.message === 'string' ? result.message : 'Đã thực hiện thao tác.';
    return `✅ ${this.escapeHtml(message)}`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private normalizeGeneratedMarkdown(value: string): string {
    const namedEntities: Record<string, string> = {
      amp: '&',
      apos: "'",
      gt: '>',
      lt: '<',
      quot: '"',
    };

    return value
      .replace(
        /&#x([0-9a-f]+);|&#(\d+);|&(amp|apos|gt|lt|quot);/gi,
        (match: string, hex?: string, decimal?: string, named?: string) => {
          if (named) return namedEntities[named.toLowerCase()] || match;
          const codePoint = Number.parseInt(hex || decimal || '', hex ? 16 : 10);
          if (Number.isNaN(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
          return String.fromCodePoint(codePoint);
        },
      )
      .replace(/\\&/g, '&');
  }

  private groupButtons<T>(buttons: readonly T[], columns: number): T[][] {
    return buttons.reduce<T[][]>((rows, button) => {
      const currentRow = rows[rows.length - 1];
      if (!currentRow || currentRow.length === columns) rows.push([button]);
      else currentRow.push(button);
      return rows;
    }, []);
  }

  private formatMoney(amount: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  }

  public buildNotificationActionsMarkup() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🆗 Đã hiểu', 'notice:ack'),
        Markup.button.callback('✖️ Đóng', 'notice:close'),
      ],
    ]);
  }

  public buildDebtDeleteConfirmationMarkup(debtId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Xác nhận xóa', `debt:delete_confirm:${debtId}`)],
      [Markup.button.callback('❌ Hủy', 'debt:delete_cancel')],
    ]);
  }

  /**
   * Builds interactive action buttons for Admin user list
   */
  public buildAdminUsersMarkup() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎟️ Tạo link mời', 'action:create_invite')],
      [Markup.button.callback('🔄 Làm mới danh sách', 'action:refresh_users')],
      [Markup.button.callback('❌ Đóng', 'message:close')],
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
      ? Markup.button.callback('💬 Đổi sang nhắn tin', `switch_reminder:text:${reminderId}`)
      : Markup.button.callback('📞 Đổi sang báo động', `switch_reminder:call:${reminderId}`);

    return Markup.inlineKeyboard([
      [switchBtn, Markup.button.callback('❌ Hủy', `cancel_reminder:${reminderId}`)],
      [Markup.button.callback('🆗 Ẩn nút', `dismiss_buttons:${reminderId}`)],
    ]);
  }

  /**
   * Builds interactive buttons attached under a newly created Google Calendar event
   */
  public buildCalendarConfirmationMarkup(eventId?: string, htmlLink?: string) {
    const buttons = [];
    const actionRow = [];
    if (htmlLink) {
      actionRow.push(Markup.button.url('📅 Mở lịch', htmlLink));
    }
    if (eventId) {
      actionRow.push(Markup.button.callback('🗑️ Xóa', `delete_calendar_event:${eventId}`));
    }
    if (actionRow.length > 0) buttons.push(actionRow);
    buttons.push([Markup.button.callback('🆗 Ẩn nút', `dismiss_buttons:${eventId || 'cal'}`)]);

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

    let remaining = this.normalizeGeneratedMarkdown(text);
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
      } catch (firstError) {
        const err = firstError as Error;
        this.logger.warn(`Markdown reply failed (${err.message}). Retrying with plain text...`);
        try {
          if (markupToSend) {
            await ctx.reply(chunk, markupToSend);
          } else {
            await ctx.reply(chunk, this.getRemoveKeyboard());
          }
        } catch (secondError) {
          const err2 = secondError as Error;
          this.logger.warn(
            `Reply with markup failed (${err2.message}). Falling back to pure text without custom buttons...`,
          );
          try {
            await ctx.reply(chunk, this.getRemoveKeyboard());
          } catch (thirdError) {
            const err3 = thirdError as Error;
            this.logger.error(`Failed to deliver message completely: ${err3.message}`);
          }
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
