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

  /**
   * Builds interactive buttons for reminders list with 1-click cancel
   */
  public buildRemindersMarkup(
    reminders: Array<{
      id?: string | null;
      title?: string | null;
      remindAt?: Date | string | null;
    }>,
    locale: SupportedLocale = DEFAULT_LOCALE,
  ) {
    const valid = reminders.filter((r) => r.id && r.title);
    if (valid.length === 0) {
      return Markup.inlineKeyboard([
        [
          Markup.button.callback(
            translate(locale, 'telegram.reminders.refresh'),
            'action:refresh_reminders',
          ),
        ],
        [Markup.button.callback(translate(locale, 'telegram.reminders.close'), 'message:close')],
      ]);
    }

    const buttons = valid
      .slice(0, 6)
      .map((r, index) =>
        Markup.button.callback(
          translate(locale, 'telegram.reminders.cancelButton', { index: index + 1 }),
          `cancel_reminder:${r.id}`,
        ),
      );
    const inlineButtons = buttons.reduce<Array<(typeof buttons)[number][]>>(
      (rows, button, index) => {
        if (index % 2 === 0) rows.push([button]);
        else rows[rows.length - 1].push(button);
        return rows;
      },
      [],
    );
    inlineButtons.push([
      Markup.button.callback(
        translate(locale, 'telegram.reminders.refresh'),
        'action:refresh_reminders',
      ),
      Markup.button.callback(translate(locale, 'telegram.reminders.close'), 'message:close'),
    ]);

    return Markup.inlineKeyboard(inlineButtons);
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

  private formatTaskDue(due?: unknown): string {
    if (typeof due !== 'string' || !due.trim()) return '';
    try {
      const parsedDate = new Date(due);
      if (Number.isNaN(parsedDate.getTime())) return due.trim();
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(parsedDate);
    } catch {
      return due.trim();
    }
  }

  private formatFinanceOccurredAt(occurredAt?: unknown): string {
    if (typeof occurredAt !== 'string' || !occurredAt.trim()) return '';
    try {
      const parsedDate = new Date(occurredAt);
      if (Number.isNaN(parsedDate.getTime())) return occurredAt.trim();
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(parsedDate);
    } catch {
      return occurredAt.trim();
    }
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
      const placeLine =
        typeof payload.placeName === 'string' && payload.placeName.trim()
          ? `\n📍 Địa điểm: <i>${this.escapeHtml(payload.placeName.trim())}</i>`
          : '';
      const occurredAtFormatted = this.formatFinanceOccurredAt(payload.occurredAt);
      const occurredAtLine = occurredAtFormatted
        ? `\n📅 Ngày phát sinh: <i>${this.escapeHtml(occurredAtFormatted)}</i>`
        : '';

      const jsonPayload = {
        type: payload.type,
        amount: payload.amount,
        category: payload.category || 'Khác',
        note: payload.note,
        ...(payload.placeName ? { placeName: payload.placeName } : {}),
        ...(payload.occurredAt ? { occurredAt: payload.occurredAt } : {}),
      };
      const jsonBlock = `<pre><code class="language-json">${this.escapeHtml(JSON.stringify(jsonPayload, null, 2))}</code></pre>`;

      return `⚠️ <b>XÁC NHẬN THU–CHI</b>\n\n<b>${this.escapeHtml(type)}</b>\n💵 ${this.escapeHtml(amount)}\n🏷️ ${this.escapeHtml(category)}\n📝 ${this.escapeHtml(note)}${placeLine}${occurredAtLine}\n\n📄 <b>Payload JSON:</b>\n${jsonBlock}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để ghi sổ.`;
    }
    if (name === 'update_finance_transaction') {
      const type =
        payload.type === 'income'
          ? 'Khoản thu'
          : payload.type === 'expense'
            ? 'Khoản chi'
            : undefined;
      const amount =
        typeof payload.amount === 'number' ? this.formatMoney(payload.amount) : undefined;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      const note = typeof payload.note === 'string' ? payload.note : undefined;
      const occurredAtFormatted = this.formatFinanceOccurredAt(payload.occurredAt);

      const changeLines: string[] = [];
      if (type) changeLines.push(`<b>${this.escapeHtml(type)}</b>`);
      if (amount) changeLines.push(`💵 ${this.escapeHtml(amount)}`);
      if (category) changeLines.push(`🏷️ ${this.escapeHtml(category)}`);
      if (note) changeLines.push(`📝 ${this.escapeHtml(note)}`);
      if (occurredAtFormatted) {
        changeLines.push(`📅 Ngày phát sinh: <i>${this.escapeHtml(occurredAtFormatted)}</i>`);
      }

      return `⚠️ <b>XÁC NHẬN CẬP NHẬT THU–CHI</b>\n\n${changeLines.join('\n') || 'Cập nhật thông tin giao dịch gần nhất'}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để cập nhật.`;
    }
    if (name === 'create_finance_transactions') {
      const list = Array.isArray(payload.transactions)
        ? (payload.transactions as Array<Record<string, unknown>>)
        : [];
      let total = 0;
      const lines = list.map((item, idx) => {
        const type = item.type === 'income' ? 'Thu' : 'Chi';
        const amountNum = typeof item.amount === 'number' ? item.amount : 0;
        total += amountNum;
        const amountText = this.formatMoney(amountNum);
        const category =
          typeof item.category === 'string' && item.category !== 'Khác'
            ? ` (${item.category})`
            : '';
        const note = typeof item.note === 'string' ? item.note : 'Chưa có mô tả';
        const place =
          typeof item.placeName === 'string' && item.placeName.trim()
            ? ` · 📍 ${item.placeName.trim()}`
            : '';
        return `${idx + 1}. <b>${this.escapeHtml(type)}</b>: ${this.escapeHtml(amountText)}${this.escapeHtml(category)} · ${this.escapeHtml(note)}${this.escapeHtml(place)}`;
      });

      const firstOccurredAt = list[0]?.occurredAt;
      const occurredAtFormatted =
        typeof firstOccurredAt === 'string' ? this.formatFinanceOccurredAt(firstOccurredAt) : '';
      const dateSuffix = occurredAtFormatted
        ? `\n📅 Ngày phát sinh: <i>${this.escapeHtml(occurredAtFormatted)}</i>`
        : '';

      return `⚠️ <b>XÁC NHẬN THU–CHI HÀNG LOẠT (${list.length} khoản)</b>\n\n${lines.join('\n')}\n\n💰 <b>Tổng tiền:</b> ${this.escapeHtml(this.formatMoney(total))}${dateSuffix}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để ghi sổ tất cả.`;
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
        const notes =
          typeof task.notes === 'string' && task.notes.trim()
            ? `\n   📝 <i>${this.escapeHtml(task.notes.trim())}</i>`
            : '';
        const dueFormatted = this.formatTaskDue(task.due);
        const due = dueFormatted ? `\n   ⏳ <i>Hạn chót: ${this.escapeHtml(dueFormatted)}</i>` : '';
        const prefix = tasks.length > 1 ? `${index + 1}. ` : '';
        return `${prefix}<b>${this.escapeHtml(title)}</b>${notes}${due}`;
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
      const separator = tasks.length > 1 ? '\n\n' : '\n';
      return `⚠️ <b>XÁC NHẬN THÊM VIỆC</b>\n\n${taskLines.join(separator)}${warningText ? `\n\n${warningText}\n\nBạn vẫn có thể xác nhận nếu đây là các việc riêng.` : ''}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để thêm.`;
    }
    if (name === 'create_debt') {
      const isReceivable = payload.direction === 'receivable';
      const typeText = isReceivable ? 'Cho vay (Người khác nợ bạn)' : 'Đi vay (Bạn nợ người khác)';
      const counterparty =
        typeof payload.counterparty === 'string' ? payload.counterparty : 'Chưa rõ';
      const alias =
        typeof payload.counterpartyAlias === 'string' && payload.counterpartyAlias.trim()
          ? ` (${payload.counterpartyAlias.trim()})`
          : '';
      const amount =
        typeof payload.amount === 'number' ? this.formatMoney(payload.amount) : 'Chưa rõ';
      const note =
        typeof payload.note === 'string' && payload.note.trim()
          ? payload.note.trim()
          : 'Không có ghi chú';
      const dueFormatted = this.formatTaskDue(payload.dueAt);
      const dueLine = dueFormatted ? `\n⏳ Hạn trả: <i>${this.escapeHtml(dueFormatted)}</i>` : '';
      const contactLine =
        payload.createNewContact === true ? '\n👤 Danh bạ: <i>Lưu liên hệ mới vào danh bạ</i>' : '';

      return `⚠️ <b>XÁC NHẬN GHI NỢ / CHO VAY</b>\n\n<b>${this.escapeHtml(typeText)}</b>\n👤 Đối tác: <b>${this.escapeHtml(counterparty)}${this.escapeHtml(alias)}</b>\n💵 Số tiền: <b>${this.escapeHtml(amount)}</b>\n📝 Ghi chú: ${this.escapeHtml(note)}${dueLine}${contactLine}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để lưu vào sổ nợ.`;
    }
    if (name === 'record_debt_payment') {
      const amount =
        typeof payload.amount === 'number' ? this.formatMoney(payload.amount) : 'Chưa rõ';
      return `⚠️ <b>XÁC NHẬN TRẢ NỢ</b>\n\n💵 Số tiền trả: <b>${this.escapeHtml(amount)}</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để ghi nhận trả nợ.`;
    }
    if (name === 'update_debt_contact') {
      const contactName = typeof payload.name === 'string' ? payload.name : 'Chưa rõ';
      const alias =
        typeof payload.alias === 'string' && payload.alias.trim()
          ? ` (${payload.alias.trim()})`
          : '';
      return `⚠️ <b>XÁC NHẬN CẬP NHẬT DANH BẠ NỢ</b>\n\n👤 Tên mới: <b>${this.escapeHtml(contactName)}${this.escapeHtml(alias)}</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để cập nhật.`;
    }
    if (name === 'delete_debt') {
      return `⚠️ <b>XÁC NHẬN XÓA KHOẢN CÔNG NỢ</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để xóa vĩnh viễn khoản công nợ này.`;
    }
    if (name === 'create_calendar_event') {
      const summary = typeof payload.summary === 'string' ? payload.summary : 'Lịch hẹn mới';
      const timeFormatted = this.formatTaskDue(payload.startDateTime || payload.startDate);
      const timeLine = timeFormatted
        ? `\n⏰ Thời gian: <i>${this.escapeHtml(timeFormatted)}</i>`
        : '';
      const desc =
        typeof payload.description === 'string' && payload.description.trim()
          ? `\n📝 <i>${this.escapeHtml(payload.description.trim())}</i>`
          : '';
      const loc =
        typeof payload.location === 'string' && payload.location.trim()
          ? `\n📍 <i>${this.escapeHtml(payload.location.trim())}</i>`
          : '';
      return `⚠️ <b>XÁC NHẬN TẠO LỊCH HẸN</b>\n\n📅 <b>${this.escapeHtml(summary)}</b>${timeLine}${desc}${loc}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để tạo trên Google Calendar.`;
    }
    if (name === 'delete_calendar_event') {
      return `⚠️ <b>XÁC NHẬN XÓA SỰ KIỆN LỊCH</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để xóa sự kiện khỏi Google Calendar.`;
    }
    if (name === 'create_reminder') {
      const title = typeof payload.title === 'string' ? payload.title : 'Lời nhắc mới';
      const timeFormatted = this.formatTaskDue(payload.remindAt);
      const timeLine = timeFormatted
        ? `\n⏰ Thời gian: <i>${this.escapeHtml(timeFormatted)}</i>`
        : '';
      const type = payload.notifyType === 'call' ? '📞 Gọi báo động' : '💬 Nhắn tin';
      return `⚠️ <b>XÁC NHẬN CÀI LỜI NHẮC</b>\n\n🔔 <b>${this.escapeHtml(title)}</b>${timeLine}\n📱 Hình thức: ${this.escapeHtml(type)}\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để cài nhắc.`;
    }
    if (name === 'delete_reminder') {
      return `⚠️ <b>XÁC NHẬN HỦY LỜI NHẮC</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để hủy lời nhắc này.`;
    }
    if (name === 'update_reminder') {
      const action = payload.action;
      const minutes = typeof payload.minutes === 'number' ? payload.minutes : 15;
      const desc =
        action === 'snooze'
          ? `Hoãn thêm ${minutes} phút`
          : `Đổi hình thức sang ${payload.notifyType === 'call' ? 'gọi báo động' : 'nhắn tin'}`;
      return `⚠️ <b>XÁC NHẬN CẬP NHẬT LỜI NHẮC</b>\n\n📝 Thao tác: <b>${this.escapeHtml(desc)}</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để áp dụng.`;
    }
    if (name === 'complete_task') {
      return `⚠️ <b>XÁC NHẬN HOÀN THÀNH VIỆC</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để đánh dấu hoàn thành công việc.`;
    }
    if (name === 'create_invite_link') {
      return `⚠️ <b>XÁC NHẬN TẠO LINK MỜI</b>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để tạo link mời người dùng mới.`;
    }
    if (name === 'ban_user') {
      const targetUserId =
        typeof payload.targetUserId === 'string' ? payload.targetUserId : 'Chưa rõ';
      return `⚠️ <b>XÁC NHẬN KHÓA QUYỀN NGƯỜI DÙNG</b>\n\n👤 ID: <code>${this.escapeHtml(targetUserId)}</code>\n\nMã: <code>${this.escapeHtml(referenceId)}</code>\nBấm <b>Xác nhận</b> để thu hồi quyền truy cập.`;
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

    if (name === 'create_finance_transaction') {
      const tx = result.transaction as Record<string, unknown> | undefined;
      const typeText = tx?.type === 'income' ? 'Khoản thu' : 'Khoản chi';
      const amountText =
        typeof tx?.amountText === 'string'
          ? tx.amountText
          : typeof tx?.amount === 'number'
            ? this.formatMoney(tx.amount)
            : '';
      const noteText = typeof tx?.note === 'string' ? tx.note : '';
      const placeText =
        typeof tx?.placeName === 'string' && tx.placeName.trim()
          ? ` · 📍 ${tx.placeName.trim()}`
          : '';
      const categoryText =
        typeof tx?.category === 'string' && tx.category !== 'Khác' ? ` (${tx.category})` : '';
      const occurredAtText = this.formatFinanceOccurredAt(tx?.occurredAt);
      const dateSuffix = occurredAtText ? ` · 📅 ${occurredAtText}` : '';
      return `✅ <b>Đã ghi sổ thu–chi</b> · ${this.escapeHtml(typeText)} ${this.escapeHtml(amountText)}${this.escapeHtml(categoryText)} · ${this.escapeHtml(noteText)}${this.escapeHtml(placeText)}${this.escapeHtml(dateSuffix)}`;
    }
    if (name === 'update_finance_transaction') {
      const tx = result.transaction as Record<string, unknown> | undefined;
      const typeText = tx?.type === 'income' ? 'Khoản thu' : 'Khoản chi';
      const amountText =
        typeof tx?.amountText === 'string'
          ? tx.amountText
          : typeof tx?.amount === 'number'
            ? this.formatMoney(tx.amount)
            : '';
      const noteText = typeof tx?.note === 'string' ? tx.note : '';
      const categoryText =
        typeof tx?.category === 'string' && tx.category !== 'Khác' ? ` (${tx.category})` : '';
      const occurredAtText = this.formatFinanceOccurredAt(tx?.occurredAt);
      const dateSuffix = occurredAtText ? ` · 📅 ${occurredAtText}` : '';
      return `✅ <b>Đã cập nhật giao dịch thu–chi</b> · ${this.escapeHtml(typeText)} ${this.escapeHtml(amountText)}${this.escapeHtml(categoryText)} · ${this.escapeHtml(noteText)}${this.escapeHtml(dateSuffix)}`;
    }
    if (name === 'create_finance_transactions') {
      const created = Array.isArray(result.created)
        ? (result.created as Array<Record<string, unknown>>)
        : [];
      const totalAmountText =
        typeof result.totalAmountText === 'string'
          ? result.totalAmountText
          : typeof result.totalAmount === 'number'
            ? this.formatMoney(result.totalAmount)
            : '';
      const itemsList = created
        .slice(0, 5)
        .map((item) => {
          const amountText =
            typeof item.amountText === 'string'
              ? item.amountText
              : this.formatMoney(Number(item.amount) || 0);
          const note = typeof item.note === 'string' ? item.note : '';
          const place =
            typeof item.placeName === 'string' && item.placeName.trim()
              ? ` (📍 ${item.placeName.trim()})`
              : '';
          return `• ${amountText} · ${note}${place}`;
        })
        .join('\n');
      const remaining = created.length - 5;
      const moreText = remaining > 0 ? `\n• ...và ${remaining} khoản khác` : '';
      return `✅ <b>Đã ghi sổ ${created.length} khoản</b> (Tổng: ${this.escapeHtml(totalAmountText)})\n${this.escapeHtml(itemsList)}${moreText}`;
    }
    if (name === 'create_task') {
      const task = result.task as Record<string, unknown> | undefined;
      const title = typeof task?.title === 'string' ? task.title : 'Công việc mới';
      const dueFormatted = this.formatTaskDue(task?.due);
      const dueText = dueFormatted ? ` (Hạn: ${dueFormatted})` : '';
      return `✅ <b>Đã thêm việc</b> · ${this.escapeHtml(title)}${this.escapeHtml(dueText)}`;
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
    if (name === 'delete_calendar_event') {
      return `🗑️ <b>Đã xóa sự kiện lịch</b>`;
    }
    if (name === 'create_reminder') {
      const title = typeof result.title === 'string' ? result.title : 'Lời nhắc';
      const time = typeof result.formattedTime === 'string' ? ` · ${result.formattedTime}` : '';
      return `✅ <b>Đã cài nhắc</b> · ${this.escapeHtml(title)}${this.escapeHtml(time)}`;
    }
    if (name === 'delete_reminder') {
      return `🗑️ <b>Đã hủy lời nhắc</b>`;
    }
    if (name === 'update_reminder') {
      return `✅ <b>Đã cập nhật lời nhắc</b>`;
    }
    if (name === 'create_debt') {
      const debt = result.debt as Record<string, unknown> | undefined;
      const isReceivable = debt?.direction === 'receivable';
      const actionText = isReceivable ? 'Đã ghi khoản cho vay' : 'Đã ghi khoản vay';
      const counterparty = typeof debt?.counterparty === 'string' ? debt.counterparty : '';
      const alias =
        typeof debt?.counterpartyAlias === 'string' && debt.counterpartyAlias.trim()
          ? ` (${debt.counterpartyAlias.trim()})`
          : '';
      const remainingText = typeof debt?.remainingText === 'string' ? debt.remainingText : '';
      const noteText =
        typeof debt?.note === 'string' && debt.note.trim() ? ` · ${debt.note.trim()}` : '';
      return `✅ <b>${actionText}</b> · ${this.escapeHtml(counterparty)}${this.escapeHtml(alias)} · ${this.escapeHtml(remainingText)}${this.escapeHtml(noteText)}`;
    }
    if (name === 'record_debt_payment') {
      const counterparty = typeof result.counterparty === 'string' ? result.counterparty : '';
      const remainingText = typeof result.remainingText === 'string' ? result.remainingText : '';
      const settled = result.settled === true;
      const statusText = settled ? ' (Đã tất toán)' : ` (Còn lại: ${remainingText})`;
      return `✅ <b>Đã ghi nhận trả nợ</b> · ${this.escapeHtml(counterparty)}${this.escapeHtml(statusText)}`;
    }
    if (name === 'update_debt_contact') {
      const contact = result.contact as Record<string, unknown> | undefined;
      const nameText = typeof contact?.name === 'string' ? contact.name : '';
      const alias =
        typeof contact?.alias === 'string' && contact.alias.trim()
          ? ` (${contact.alias.trim()})`
          : '';
      return `✅ <b>Đã cập nhật danh bạ</b> · ${this.escapeHtml(nameText)}${this.escapeHtml(alias)}`;
    }
    if (name === 'delete_debt') {
      return `🗑️ <b>Đã xóa khoản công nợ</b>`;
    }
    if (name === 'create_invite_link') {
      const link = typeof result.link === 'string' ? result.link : '';
      const linkText = link ? ` · 🔗 <code>${this.escapeHtml(link)}</code>` : '';
      return `✅ <b>Đã tạo link mời</b>${linkText}`;
    }
    if (name === 'ban_user') {
      return `✅ <b>Đã thu hồi quyền người dùng</b>`;
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
