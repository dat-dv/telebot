import { Update, Start, Help, Command, On, Action, Ctx } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { AuthGuard } from './guards/auth.guard';
import { TelegramUiService } from './services/telegram-ui.service';
import { VoiceTranscriptionService } from './services/voice-transcription.service';
import { ReceiptImageAnalysisService } from './services/receipt-image-analysis.service';
import { GeminiService } from '../gemini/gemini.service';
import { ConversationHistoryService } from '../gemini/services/conversation-history.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { GoogleTasksService } from '../google/google-tasks.service';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { RemindersService } from '../reminders/reminders.service';
import { FinanceService } from '../finance/finance.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { ReportsTokenService } from '../reports/reports-token.service';
import { localeTag, normalizeLocale, translate } from '@telebot/contracts';

@Update()
@UseGuards(AuthGuard)
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly conversationHistoryService: ConversationHistoryService,
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly tasksService: GoogleTasksService,
    private readonly calendarService: GoogleCalendarService,
    private readonly remindersService: RemindersService,
    private readonly uiService: TelegramUiService,
    private readonly voiceTranscriptionService: VoiceTranscriptionService,
    private readonly receiptImageAnalysisService: ReceiptImageAnalysisService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly reportsTokens: ReportsTokenService,
  ) {}

  private async getReportsUrl(userId?: number): Promise<string> {
    const appUrl = this.configService.getOrThrow<string>('appUrl').replace(/\/+$/, '');
    if (!userId) return '';
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(appUrl)) {
      return '';
    }
    try {
      const token = await this.reportsTokens.issueExchangeToken(userId);
      return `${appUrl}/api/access?token=${encodeURIComponent(token)}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unable to create dashboard link for user ${userId}: ${message}`);
      return '';
    }
  }

  private async cancelPendingUserActions(ctx: Context, userId: number): Promise<void> {
    const cancelledToolActions = this.geminiService.cancelPendingActionsForUser?.(userId) ?? [];
    for (const action of cancelledToolActions) {
      if (action.chatId && action.messageId) {
        try {
          await ctx.telegram.editMessageText(
            action.chatId,
            action.messageId,
            undefined,
            this.uiService.formatResultBox(
              'cancelled',
              { changed: false },
              action.referenceId,
              true,
            ),
            { parse_mode: 'HTML', ...this.uiService.buildNotificationActionsMarkup() },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.debug(`Could not update cancelled message ${action.messageId}: ${message}`);
        }
      }
    }

    const cancelledVoiceRequests =
      this.voiceTranscriptionService.cancelPendingVoiceRequestsForUser?.(userId) ?? [];
    for (const req of cancelledVoiceRequests) {
      if (req.chatId && req.messageId) {
        try {
          await ctx.telegram.editMessageText(
            req.chatId,
            req.messageId,
            undefined,
            '❌ Đã hủy yêu cầu từ voice.',
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.debug(
            `Could not update cancelled voice message ${req.messageId}: ${message}`,
          );
        }
      }
    }
  }

  private async requestToolConfirmation(
    ctx: Context,
    userId: number,
    name: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.cancelPendingUserActions(ctx, userId);
    const pending = this.geminiService.queueToolConfirmation(
      name,
      payload,
      userId,
      ctx.botInfo?.username,
    );
    const sent = await ctx.reply(
      this.uiService.formatConfirmationBox(pending.name, pending.payload, pending.referenceId),
      { parse_mode: 'HTML', ...this.uiService.buildConfirmationMarkup(pending.id) },
    );
    if (sent && typeof sent === 'object' && 'message_id' in sent && 'chat' in sent) {
      const msg = sent as { chat: { id: number | string }; message_id: number };
      this.geminiService.attachMessageToPendingAction(pending.id, msg.chat.id, msg.message_id);
    }
  }

  private async processAgentRequest(ctx: Context, text: string, userId: number): Promise<void> {
    const botUsername = ctx.botInfo?.username;
    const history = this.conversationHistoryService.getHistory(userId);
    const chatResult = await this.uiService.withTyping(ctx, () =>
      this.geminiService.chat(text, history, userId, botUsername),
    );

    // Lưu tin nhắn người dùng vào bộ nhớ đệm ngắn hạn
    this.conversationHistoryService.appendUserMessage(userId, text);

    if (chatResult.pendingAction) {
      const { name, payload, id, referenceId } = chatResult.pendingAction;
      const confirmBox = this.uiService.formatConfirmationBox(name, payload, referenceId);
      this.conversationHistoryService.appendModelMessage(
        userId,
        `Yêu cầu xác nhận thao tác ${name}: ${JSON.stringify(payload)}`,
      );
      const sent = await ctx.reply(confirmBox, {
        parse_mode: 'HTML',
        ...this.uiService.buildConfirmationMarkup(id),
      });
      if (sent && typeof sent === 'object' && 'message_id' in sent && 'chat' in sent) {
        const msg = sent as { chat: { id: number | string }; message_id: number };
        this.geminiService.attachMessageToPendingAction(id, msg.chat.id, msg.message_id);
      }
      return;
    }

    if (chatResult.text) {
      this.conversationHistoryService.appendModelMessage(userId, chatResult.text);
    }

    let extraMarkup: ReturnType<typeof Markup.inlineKeyboard> | undefined = undefined;

    if (chatResult.lastTool) {
      const { name, result } = chatResult.lastTool;

      if (name === 'create_reminder' && result.success && result.reminderId) {
        extraMarkup = this.uiService.buildReminderConfirmationMarkup(
          result.reminderId as string,
          (result.notifyType as 'text' | 'call') || 'text',
        );
      } else if (name === 'create_calendar_event' && result.success) {
        extraMarkup = this.uiService.buildCalendarConfirmationMarkup(
          result.eventId as string,
          result.htmlLink as string,
        );
      }
    }

    await this.uiService.sendSafeReply(ctx, chatResult.text, extraMarkup);
  }

  private isDashboardRequest(text: string): boolean {
    const normalized = text.trim().toLocaleLowerCase('vi-VN');
    return [
      'dashboard',
      'mở dashboard',
      'xem dashboard',
      'cho anh xem dashboard',
      'cho anh link dashboard',
      'link dashboard',
    ].includes(normalized.replace(/\s+/g, ' '));
  }

  @Start()
  public async onStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    await this.cancelPendingUserActions(ctx, userId);

    const fromName = ctx.from?.first_name || 'bạn';
    const isAdmin = this.usersService.isAdmin(userId);
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';

    const locale = await this.usersService.getPreferredLocale(userId);
    await this.uiService.syncCommandMenu(ctx, isAdmin, locale);

    let authUrl = '';
    try {
      authUrl = this.googleAuthService.generateAuthUrl(userId);
    } catch {
      // ignore
    }

    // Handle deep link invite: /start invite_<code>
    if (text.startsWith('/start invite_')) {
      const inviteCode = text.replace('/start ', '').trim();
      const consumeResult = await this.usersService.consumeInvite(inviteCode, {
        id: userId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
      });

      if (!consumeResult.success) {
        await ctx.reply(`⚠️ ${consumeResult.message}`, { parse_mode: 'Markdown' });
        return;
      }

      const activatedMessage = `🎉 *CHÚC MỪNG ${fromName.toUpperCase()} ĐÃ KÍCH HOẠT THÀNH CÔNG!*

Bạn đã được cấp quyền sử dụng trợ lý cá nhân độc lập 100%.

👉 *Bước tiếp theo: Kết nối tài khoản Google của bạn*
Nhấn vào nút bên dưới để cấp quyền Google Calendar & Tasks cho trợ lý:`;

      if (authUrl) {
        await ctx.reply(
          activatedMessage,
          Markup.inlineKeyboard([[Markup.button.url('🔗 Đăng nhập Google', authUrl)]]),
        );
        await ctx.reply(
          '💡 *Lưu ý:* Sau khi đăng nhập và bấm **Cho phép** trên trình duyệt, tài khoản của bạn sẽ tự động được kích hoạt ngay lập tức!',
          { parse_mode: 'Markdown', ...this.uiService.getRemoveKeyboard() },
        );
      } else {
        await ctx.reply(
          activatedMessage + '\n\nGõ lệnh `/login` để nhận đường link kết nối Google nhé!',
          { parse_mode: 'Markdown', ...this.uiService.getRemoveKeyboard() },
        );
      }
      return;
    }

    // Normal /start
    const isGoogleConnected = this.googleAuthService.isAuthorized(userId);
    const googleStatus = isGoogleConnected
      ? '✅ *Tài khoản Google*: Đã kết nối (Sẵn sàng)'
      : '⚠️ *Tài khoản Google*: Chưa kết nối (Bấm nút bên dưới)';

    const welcomeMessage = `👋 Xin chào *${fromName}*!
━━━━━━━━━━━━━━━━━━━━
Tôi là trợ lý AI cá nhân toàn năng của bạn, hỗ trợ:
📅 *Google Calendar* & 📝 *Google Tasks*
💰 *Quản lý Thu–Chi* & 🧾 *Quét ảnh Hóa đơn (OCR)*
💳 *Sổ nợ & Cho vay* & ⏰ *Nhắc nhở / Gọi điện thoại*
📊 *Web Dashboard trực quan*

${googleStatus}
━━━━━━━━━━━━━━━━━━━━
📱 *Bạn có thể chạm vào các nút bên dưới hoặc nhắn tin/gửi voice tự nhiên:*
• ⏰ _"15 phút nữa nhắc anh tắt bếp"_
• 📅 _"Chiều mai 14h họp dự án với sếp"_
• 📝 _"Thêm việc chuẩn bị slide báo cáo"_
• 💰 _"Ăn trưa bún bò 45k" (hoặc gửi ảnh hóa đơn)_
• 💳 _"Anh Nam vay 500k hẹn cuối tháng trả"_
• 📊 _"Hôm nay anh có lịch gì và đã tiêu bao nhiêu?"_`;

    const inlineMarkup = this.uiService.buildMainMenuInlineMarkup(
      isAdmin,
      isGoogleConnected,
      authUrl,
    );

    await this.uiService.sendSafeReply(ctx, welcomeMessage, inlineMarkup);
  }

  @Command('language')
  public async onLanguage(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    const locale = await this.usersService.getPreferredLocale(userId);
    await ctx.reply(
      translate(locale, 'telegram.language.choose'),
      this.uiService.buildLanguageMarkup(locale),
    );
  }

  @Action(/^locale:(vi|en)$/)
  public async onLocale(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const callback = ctx.callbackQuery;
    if (!userId || !callback || !('data' in callback)) return;
    const locale = normalizeLocale(callback.data.slice('locale:'.length));
    await this.usersService.setPreferredLocale(userId, locale);
    await this.uiService.syncCommandMenu(ctx, this.usersService.isAdmin(userId), locale);
    await ctx.answerCbQuery();
    await ctx.editMessageText(translate(locale, 'telegram.language.updated'));
  }

  @Help()
  @Command('help')
  public async onHelp(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (userId) await this.cancelPendingUserActions(ctx, userId);
    const isAdmin = userId ? this.usersService.isAdmin(userId) : false;
    const isGoogleConnected = userId ? this.googleAuthService.isAuthorized(userId) : false;

    let authUrl = '';
    try {
      if (userId) authUrl = this.googleAuthService.generateAuthUrl(userId);
    } catch {
      // ignore
    }

    const inlineMarkup = this.uiService.buildMainMenuInlineMarkup(
      isAdmin,
      isGoogleConnected,
      authUrl,
    );

    const helpHeader = isAdmin
      ? `👑 *HƯỚNG DẪN TRỢ LÝ AI (DÀNH CHO ADMIN)*`
      : `📖 *HƯỚNG DẪN SỬ DỤNG TRỢ LÝ AI*`;

    const adminSection = isAdmin
      ? `\n7️⃣ *CÔNG CỤ QUẢN TRỊ HỆ THỐNG*
• 🎟️ *Tạo Link Mời*: \`/invite\` (hoặc nhắn _"Tạo link mời"_)
• 👥 *Danh Sách User*: \`/users\` (hoặc nhắn _"Xem danh sách user"_)
• 🚫 *Khóa Quyền*: \`/ban <user_id>\`
`
      : '';

    const helpMessage = `${helpHeader}
━━━━━━━━━━━━━━━━━━━━

1️⃣ *LỜI NHẮC & GỌI ĐIỆN TỰ ĐỘNG (REMINDERS)*
• ⏰ _"15 phút nữa nhắc anh tắt bếp"_ ➔ Gửi tin nhắn Telegram
• 📞 _"8h tối nay gọi nhá máy nhắc anh uống thuốc"_ ➔ Đổ chuông báo động
• 📋 Lệnh nhanh: \`/reminders\` (Xem & hủy lời nhắc)

2️⃣ *LỊCH HẸN GOOGLE CALENDAR*
• 📅 _"Mai 14h họp kickoff dự án với khách hàng"_ ➔ Tự tạo lịch & cài chuông
• 📋 Lệnh nhanh: \`/today\` (Lịch hôm nay), \`/week\` (Lịch 7 ngày)

3️⃣ *DANH SÁCH VIỆC CẦN LÀM (GOOGLE TASKS)*
• 📝 _"Thêm việc chuẩn bị tài liệu thuyết trình"_
• 📋 Lệnh nhanh: \`/tasks\` (Xem danh sách & tick hoàn thành 1-chạm)

4️⃣ *QUẢN LÝ THU–CHI & QUÉT ẢNH HÓA ĐƠN (FINANCE)*
• 💰 _"Vừa ăn sáng hết 35k tiền phở"_ hoặc _"Nhận lương 20tr"_
• 🧾 *Chụp/Gửi ảnh hóa đơn/biên lai*: AI tự động đọc và ghi sổ
• 📋 Lệnh nhanh: \`/finance\` (Xem tổng thu–chi hôm nay)

5️⃣ *SỔ CÔNG NỢ & DANH BẠ (DEBTS & CONTACTS)*
• 💳 _"Cho anh Hùng vay 2 triệu hẹn tuần sau trả"_
• 💵 _"Anh Hùng vừa trả 1 triệu"_ ➔ Tự động cập nhật số dư còn lại
• 📋 Lệnh nhanh: \`/debts\` (Xem toàn bộ các khoản vay & cho vay)

6️⃣ *BẢNG ĐIỀU KHIỂN TRỰC QUAN (WEB DASHBOARD)*
• 📊 Lệnh nhanh: \`/dashboard\` ➔ Mở trang web xem biểu đồ thu chi, việc cần làm, lịch trình.${adminSection}
━━━━━━━━━━━━━━━━━━━━
💡 *Mẹo:* Bạn có thể nhắn tin, gửi Voice ghi âm hoặc gửi ảnh hóa đơn tự nhiên bất cứ lúc nào!`;

    await this.uiService.sendSafeReply(ctx, helpMessage, inlineMarkup);
  }

  @Command('clear')
  @Command('hide')
  public async onClearKeyboard(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '✨ Đã tắt hoàn toàn bàn phím dưới đáy màn hình.',
      this.uiService.getRemoveKeyboard(),
    );
  }

  @Command('invite')
  public async onInvite(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên (Admin) mới có quyền tạo link mời.');
      return;
    }

    await this.requestToolConfirmation(ctx, userId, 'create_invite_link', {});
  }

  @Command('login')
  @Command('auth')
  public async onLogin(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      const authUrl = this.googleAuthService.generateAuthUrl(userId);
      const isConnected = this.googleAuthService.isAuthorized(userId);
      const statusText = isConnected
        ? '*(Hiện tại bạn ĐÃ kết nối Google, bấm nút bên dưới nếu muốn đổi sang tài khoản khác)*'
        : '*(Hiện tại bạn CHƯA kết nối tài khoản Google)*';

      const msg = `🔐 *KẾT NỐI GOOGLE CALENDAR & TASKS*\n\n${statusText}\n\n1️⃣ Nhấn vào nút bên dưới để mở trang đăng nhập Google.\n2️⃣ Chọn tài khoản Gmail và bấm **Cho phép (Allow)**.\n3️⃣ Hệ thống sẽ tự động kết nối trong 1 giây!`;

      await ctx.reply(
        msg,
        Markup.inlineKeyboard([[Markup.button.url('🔗 Đăng nhập Google', authUrl)]]),
      );
    } catch (err) {
      const error = err as Error;
      await ctx.reply(`⚠️ Lỗi tạo link đăng nhập: ${error.message}`);
    }
  }

  private async handleCodeExchange(ctx: Context, userId: number, rawInput: string): Promise<void> {
    const code = this.uiService.extractAuthCode(rawInput);
    if (!code) {
      await ctx.reply('ℹ️ Vui lòng bấm vào nút đăng nhập Google để cấp quyền.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    try {
      await this.uiService.withTyping(ctx, async () => {
        await this.googleAuthService.exchangeCodeForTokens(userId, code);
      });

      const isAdmin = this.usersService.isAdmin(userId);
      const inlineMarkup = this.uiService.buildMainMenuInlineMarkup(isAdmin, true, '');

      await ctx.reply(
        '🎉 *KẾT NỐI GOOGLE THÀNH CÔNG!*\n\nTài khoản Google Calendar & Google Tasks của bạn đã sẵn sàng. Bạn có thể sử dụng các nút bấm bên dưới hoặc nhắn tin tự nhiên cho bot nhé!',
        { parse_mode: 'Markdown', ...inlineMarkup },
      );
    } catch (err) {
      const error = err as Error;
      await ctx.reply(
        `❌ *Xác thực thất bại:* Mã xác thực không hợp lệ hoặc đã hết hạn.\nVui lòng gõ \`/login\` để lấy link đăng nhập mới.\nChi tiết: \`${error.message}\``,
        { parse_mode: 'Markdown' },
      );
    }
  }

  @Command('status')
  public async onStatus(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const fromName = ctx.from?.first_name || 'bạn';
    const isGoogleConnected = this.googleAuthService.isAuthorized(userId);
    const isAdmin = this.usersService.isAdmin(userId);

    const msg = `📊 *TRẠNG THÁI TÀI KHOẢN*

👤 *Người dùng*: *${fromName}* (\`${userId}\`)
👑 *Vai trò*: ${isAdmin ? '👑 Quản trị viên (Admin)' : '👤 Người dùng (Member)'}
🔗 *Google Workspace*: ${isGoogleConnected ? '✅ Đã kết nối (Calendar & Tasks sẵn sàng)' : '❌ Chưa kết nối (bấm nút bên dưới để liên kết)'}

💡 *Mẹo:* Bạn có thể chạm vào các nút bên dưới để xem nhanh lịch trình hoặc việc cần làm.`;

    const inlineButtons = [
      ...(isGoogleConnected
        ? [[Markup.button.callback('🔄 Kiểm tra lại', 'action:refresh_status')]]
        : [
            [
              Markup.button.url(
                '🔗 Đăng nhập Google ngay',
                this.googleAuthService.generateAuthUrl(userId),
              ),
            ],
          ]),
      [Markup.button.callback('❌ Đóng', 'message:close')],
    ];

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(inlineButtons),
    });
  }

  @Command('users')
  public async onListUsers(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên mới có thể xem danh sách người dùng.');
      return;
    }

    const users = await this.usersService.getUsers();
    if (users.length === 0) {
      await ctx.reply('Chưa có người dùng nào trong cơ sở dữ liệu.');
      return;
    }

    let listText = `👥 *DANH SÁCH NGƯỜI DÙNG (${users.length}):*\n\n`;
    for (const u of users) {
      const numericId = Number(u.id);
      const isAuth = this.googleAuthService.isAuthorized(numericId);
      const name = u.firstName || u.username || 'User';
      listText += `• *${name}* (\`${u.id}\`) - ${u.role === 'admin' ? '👑 Admin' : '👤 Member'} | Google: ${isAuth ? '✅' : '❌'}\n`;
    }

    await ctx.reply(listText, {
      parse_mode: 'Markdown',
      ...this.uiService.buildAdminUsersMarkup(),
    });
  }

  @Command('ban')
  public async onBanUser(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên mới có thể thu hồi quyền.');
      return;
    }

    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const targetIdStr = text.replace(/^\/ban\s*/i, '').trim();
    const targetId = Number(targetIdStr);

    if (!targetId || isNaN(targetId)) {
      await ctx.reply('ℹ️ Cú pháp: `/ban <telegram_user_id>`', { parse_mode: 'Markdown' });
      return;
    }

    if (targetId === userId) {
      await ctx.reply('⚠️ Bạn không thể tự khóa tài khoản của chính mình.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    if (this.usersService.isAdmin(targetId)) {
      await ctx.reply('⚠️ Không thể khóa tài khoản của Quản trị viên (Admin) khác.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    await this.requestToolConfirmation(ctx, userId, 'ban_user', {
      targetUserId: targetId.toString(),
    });
  }

  @Command('today')
  public async onToday(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (userId) await this.cancelPendingUserActions(ctx, userId);
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getTodaySummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary, this.uiService.buildTodayActionsMarkup());
  }

  @Command('week')
  public async onWeek(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (userId) await this.cancelPendingUserActions(ctx, userId);
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getWeekSummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary, this.uiService.buildWeekActionsMarkup());
  }

  @Command('finance')
  @Command('money')
  public async onFinance(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    await this.cancelPendingUserActions(ctx, userId);

    const { startAt, endAt } = this.financeService.getTodayRange();
    const summary = await this.financeService.getSummary(userId, startAt, endAt);
    const transactionLines = summary.transactions.slice(0, 5).map((transaction) => {
      const icon = transaction.type === 'income' ? '➕' : '➖';
      return `${icon} ${transaction.note} — ${this.financeService.formatMoney(transaction.amount)}`;
    });
    const details = transactionLines.length > 0 ? `\n${transactionLines.join('\n')}` : '';

    await ctx.reply(
      `💰 <b>Thu–chi hôm nay</b>\nThu ${this.financeService.formatMoney(summary.income)} · Chi ${this.financeService.formatMoney(summary.expense)} · Còn ${this.financeService.formatMoney(summary.balance)}${details}`,
      { parse_mode: 'HTML' },
    );
  }

  @Command('history')
  public async onHistory(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    await this.cancelPendingUserActions(ctx, userId);
    const logs = await this.auditService.listRecent(userId);
    if (logs.length === 0) {
      await ctx.reply('📜 Chưa có lịch sử thay đổi để hiển thị.');
      return;
    }
    const text = logs
      .map(
        (log, index) =>
          `${index + 1}. ${log.action.toUpperCase()} ${log.tableName} • ${new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(log.createdAt)}`,
      )
      .join('\n');
    await ctx.reply(`📜 LỊCH SỬ GẦN ĐÂY\n\n${text}`);
  }

  @Command('debts')
  @Command('debt')
  public async onDebts(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    await this.cancelPendingUserActions(ctx, userId);

    const debts = await this.financeService.getActiveDebts(userId);
    if (debts.length === 0) {
      await ctx.reply('💳 Hiện không có khoản công nợ nào chưa tất toán.');
      return;
    }

    const receivable = debts
      .filter((debt) => debt.direction === 'receivable')
      .reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const payable = debts
      .filter((debt) => debt.direction === 'payable')
      .reduce((sum, debt) => sum + debt.remainingAmount, 0);
    await ctx.reply(
      `💳 CÔNG NỢ\nCần thu: ${this.financeService.formatMoney(receivable)}\nCần trả: ${this.financeService.formatMoney(payable)}`,
    );

    for (const [index, debt] of debts.entries()) {
      const createdAt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(debt.createdAt);
      const dueAt = debt.dueAt
        ? new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(debt.dueAt)
        : 'Chưa hẹn';
      const relation = debt.direction === 'receivable' ? 'đang nợ anh' : 'anh đang nợ';
      const note = debt.note || 'Không có mô tả';
      const contactName = debt.contact?.displayName || debt.counterparty;
      const contactAlias = debt.contact?.alias || debt.counterpartyAlias;
      await ctx.reply(
        `${index + 1}. ${contactName}${contactAlias ? ` (${contactAlias})` : ''} ${relation}\n${this.financeService.formatMoney(debt.remainingAmount)} • ${createdAt}\n${note} • Hẹn trả: ${dueAt}`,
        this.uiService.buildDebtActionsMarkup(debt.id),
      );
    }
  }

  @Command('tasks')
  @Command('task')
  public async onTasksChecklist(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    await this.cancelPendingUserActions(ctx, userId);

    try {
      const tasks = await this.uiService.withTyping(ctx, () =>
        this.tasksService.listTasks({ showCompleted: false, maxResults: 15 }, userId),
      );

      if (tasks.length === 0) {
        await ctx.reply('🎉 Bạn không có việc nào chưa hoàn thành.', { parse_mode: 'Markdown' });
        return;
      }

      let taskListText = `📝 *Việc cần làm · ${tasks.length}*\n`;
      tasks.slice(0, 10).forEach((t, index) => {
        const dueText = t.due ? ` _(Hạn: ${t.due.slice(0, 10)})_` : '';
        taskListText += `▫️ *#${index + 1}*: ${t.title}${dueText}\n`;
      });
      const checklistMarkup = this.uiService.buildTaskChecklistMarkup(tasks);
      await ctx.reply(taskListText, {
        parse_mode: 'Markdown',
        ...checklistMarkup,
      });
    } catch (err) {
      const error = err as Error;
      await ctx.reply(`⚠️ Không thể lấy danh sách công việc: ${error.message}`);
    }
  }

  @Command('dashboard')
  public async onDashboard(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (userId) await this.cancelPendingUserActions(ctx, userId);
    const reportsUrl = await this.getReportsUrl(userId);
    if (!reportsUrl) {
      await ctx.reply(
        '⚠️ Chưa thể tạo link Dashboard. Vui lòng kiểm tra cấu hình domain public (APP_URL) trên server.',
      );
      return;
    }

    await ctx.reply('📊 *Dashboard*\nThu–chi · Việc · Lịch · Nhắc · Công nợ', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📊 Mở Dashboard', reportsUrl)],
        [Markup.button.callback('❌ Đóng', 'message:close')],
      ]),
    });
  }

  @Command('reminders')
  @Command('reminder')
  public async onRemindersList(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
    await this.cancelPendingUserActions(ctx, userId);
    const locale = await this.usersService.getPreferredLocale(userId);

    try {
      const upcoming = await this.uiService.withTyping(ctx, () =>
        this.remindersService.getUserUpcomingReminders(userId),
      );

      if (upcoming.length === 0) {
        await ctx.reply(translate(locale, 'telegram.reminders.empty'), {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                translate(locale, 'telegram.reminders.refresh'),
                'action:refresh_reminders',
              ),
            ],
            [
              Markup.button.callback(
                translate(locale, 'telegram.reminders.close'),
                'message:close',
              ),
            ],
          ]),
        });
        return;
      }

      let text = `⏰ *${translate(locale, 'reminders.title').toUpperCase()} (${upcoming.length})*\n━━━━━━━━━━━━━━━━━━━━\n`;
      upcoming.forEach((r, idx) => {
        const time = new Intl.DateTimeFormat(localeTag(locale), {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(r.remindAt));
        const icon = r.notifyType === 'call' ? '📞' : '💬';
        const repeat = r.repeatType !== 'none' ? ` _(Lặp: ${r.repeatType})_` : '';
        text += `• *#${idx + 1}*: ${r.title}\n   ⏰ ${time} · ${icon}${repeat}\n\n`;
      });

      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...this.uiService.buildRemindersMarkup(upcoming, locale),
      });
    } catch (err) {
      const error = err as Error;
      await ctx.reply(translate(locale, 'telegram.reminders.fetchError', { error: error.message }));
    }
  }

  // Handle interactive inline button: complete task
  @Action(/^complete_task:(.+)$/)
  public async onCompleteTaskAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const taskId = match ? match[1] : undefined;
    const userId = ctx.from?.id;

    if (!taskId || !userId) {
      await ctx.answerCbQuery('Không tìm thấy ID công việc.');
      return;
    }

    try {
      await ctx.answerCbQuery('Hãy xác nhận payload trước khi hoàn tất.');
      await this.requestToolConfirmation(ctx, userId, 'complete_task', { taskId });
    } catch (err) {
      const error = err as Error;
      await ctx.answerCbQuery(`Lỗi: ${error.message}`);
    }
  }

  // Handle switching reminder mode: TextMe <-> CallMe
  @Action(/^switch_reminder:(text|call):(.+)$/)
  public async onSwitchReminderAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const targetType = match ? (match[1] as 'text' | 'call') : 'text';
    const reminderId = match ? match[2] : undefined;

    if (!reminderId) {
      await ctx.answerCbQuery('Không tìm thấy ID lời nhắc.');
      return;
    }

    await ctx.answerCbQuery('Hãy xác nhận payload cập nhật.');
    await this.requestToolConfirmation(ctx, ctx.from?.id || 0, 'update_reminder', {
      reminderId,
      action: 'set_notify_type',
      notifyType: targetType,
    });
  }

  // Handle canceling reminder
  @Action(/^cancel_reminder:(.+)$/)
  public async onCancelReminderAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const reminderId = match ? match[1] : undefined;
    const userId = ctx.from?.id;

    if (!reminderId || !userId) return;
    await ctx.answerCbQuery('Hãy xác nhận payload hủy lời nhắc.');
    await this.requestToolConfirmation(ctx, userId, 'delete_reminder', { reminderId });
  }

  // Handle dismissing/collapsing interactive buttons
  @Action(/^dismiss_buttons:(.+)$/)
  public async onDismissButtonsAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🆗 Đã lưu cài đặt & ẩn nút!');
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {
      // ignore
    }
  }

  // Handle deleting calendar event
  @Action(/^delete_calendar_event:(.+)$/)
  public async onDeleteCalendarEventAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const eventId = match ? match[1] : undefined;
    const userId = ctx.from?.id;

    if (!eventId || !userId) {
      await ctx.answerCbQuery('Không tìm thấy thông tin sự kiện.');
      return;
    }

    await ctx.answerCbQuery('Hãy xác nhận payload xóa lịch.');
    await this.requestToolConfirmation(ctx, userId, 'delete_calendar_event', { eventId });
  }

  // Handle interactive inline button: Done Reminder
  @Action(/^done_reminder:(.+)$/)
  public async onDoneReminderAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const reminderId = match ? match[1] : undefined;

    const userId = ctx.from?.id;
    if (!reminderId || !userId) return;
    await ctx.answerCbQuery('Hãy xác nhận payload hoàn tất.');
    await this.requestToolConfirmation(ctx, userId, 'delete_reminder', { reminderId });
  }

  // Handle interactive inline button: Snooze Reminder
  @Action(/^snooze_reminder:(\d+):(.+)$/)
  public async onSnoozeReminderAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const minutes = match ? Number(match[1]) : 15;
    const reminderId = match ? match[2] : undefined;

    const userId = ctx.from?.id;
    if (!reminderId || !userId) return;
    await ctx.answerCbQuery('Hãy xác nhận payload hoãn lời nhắc.');
    await this.requestToolConfirmation(ctx, userId, 'update_reminder', {
      reminderId,
      action: 'snooze',
      minutes,
    });
  }

  @Action('action:refresh_today')
  public async onRefreshTodayAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang cập nhật lịch trình...');
    await this.onToday(ctx);
  }

  @Action('action:refresh_week')
  public async onRefreshWeekAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang cập nhật lịch 7 ngày...');
    await this.onWeek(ctx);
  }

  @Action('action:view_week')
  public async onViewWeekAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('📊 Đang tải lịch 7 ngày tới...');
    await this.onWeek(ctx);
  }

  @Action('action:view_tasks')
  public async onViewTasksAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('📝 Đang tải danh sách công việc...');
    await this.onTasksChecklist(ctx);
  }

  @Action('action:view_finance')
  public async onViewFinanceAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('💰 Đang mở sổ thu–chi hôm nay...');
    await this.onFinance(ctx);
  }

  @Action('action:view_debts')
  public async onViewDebtsAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('💳 Đang mở sổ công nợ...');
    await this.onDebts(ctx);
  }

  @Action('action:view_reminders')
  public async onViewRemindersAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('⏰ Đang tải danh sách lời nhắc...');
    await this.onRemindersList(ctx);
  }

  @Action('action:refresh_reminders')
  public async onRefreshRemindersAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang làm mới danh sách lời nhắc...');
    await this.onRemindersList(ctx);
  }

  @Action('action:view_reports')
  public async onViewReportsAction(@Ctx() ctx: Context): Promise<void> {
    const reportsUrl = await this.getReportsUrl(ctx.from?.id);
    if (!reportsUrl) {
      await ctx.answerCbQuery('Chưa cấu hình trang báo cáo trên server.');
      return;
    }
    await ctx.answerCbQuery('Đang mở báo cáo...');
    await ctx.reply(
      '📊 Link Dashboard mới đã sẵn sàng. Bấm nút bên dưới để mở:',
      Markup.inlineKeyboard([
        [Markup.button.url('📊 Xem báo cáo', reportsUrl)],
        [Markup.button.callback('❌ Đóng', 'message:close')],
      ]),
    );
  }

  @Action(/^debt:pay:(.+)$/)
  public async onDebtPayAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Nhắn số tiền đã trả, ví dụ: “Trí trả anh 200k”.');
    await ctx.reply('💵 Nhắn số tiền đã trả, ví dụ: “Trí trả anh 200k”.');
  }

  @Action('debt:close')
  public async onDebtCloseAction(@Ctx() ctx: Context): Promise<void> {
    await this.closeMessage(ctx);
  }

  @Action('message:close')
  public async onMessageCloseAction(@Ctx() ctx: Context): Promise<void> {
    await this.closeMessage(ctx);
  }

  private async closeMessage(ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Đã đóng.');
    try {
      await ctx.deleteMessage();
    } catch {
      await ctx.editMessageReplyMarkup(undefined);
    }
  }

  @Action(/^debt:delete:(.+)$/)
  public async onDebtDeleteAction(@Ctx() ctx: Context): Promise<void> {
    const match = (ctx as { match?: RegExpExecArray }).match;
    const debtId = match?.[1];
    if (!debtId) {
      await ctx.answerCbQuery('Không tìm thấy khoản công nợ.');
      return;
    }
    await ctx.answerCbQuery('Hãy xác nhận payload xóa.');
    await ctx.reply(
      this.uiService.formatConfirmationBox(
        'delete_debt',
        { debtId },
        `REQ-${debtId.slice(0, 6).toUpperCase()}`,
      ),
      { parse_mode: 'HTML', ...this.uiService.buildDebtDeleteConfirmationMarkup(debtId) },
    );
  }

  @Action(/^debt:delete_confirm:(.+)$/)
  public async onDebtDeleteConfirmAction(@Ctx() ctx: Context): Promise<void> {
    const debtId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!debtId || !userId) return;
    const deleted = await this.financeService.deleteDebt(userId, debtId);
    await ctx.answerCbQuery(deleted ? 'Đã xóa khoản công nợ.' : 'Không tìm thấy khoản công nợ.');
    if (deleted) await ctx.editMessageText('🗑️ Đã xóa khoản công nợ này.');
  }

  @Action('debt:delete_cancel')
  public async onDebtDeleteCancelAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Đã hủy thao tác xóa.');
    await ctx.editMessageText('❌ Đã hủy, khoản công nợ vẫn được giữ nguyên.');
  }

  @Action(/^confirm:(.+)$/)
  public async onConfirmAction(@Ctx() ctx: Context): Promise<void> {
    const actionId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!actionId || !userId) return;
    try {
      const { name, result, referenceId } = await this.geminiService.confirmPendingAction(
        actionId,
        userId,
      );
      const resultBox = this.uiService.formatResultBox(name, result, referenceId);
      this.conversationHistoryService.appendModelMessage(userId, resultBox);
      await ctx.answerCbQuery('Đã xác nhận và thực hiện.');
      await ctx.editMessageText(resultBox, {
        parse_mode: 'HTML',
        ...this.uiService.buildNotificationActionsMarkup(),
      });
    } catch (error) {
      await ctx.answerCbQuery((error as Error).message);
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    }
  }

  @Action(/^cancel:(.+)$/)
  public async onCancelAction(@Ctx() ctx: Context): Promise<void> {
    const actionId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!actionId || !userId) return;
    const cancelled = this.geminiService.cancelPendingAction(actionId, userId);
    await ctx.answerCbQuery(cancelled ? 'Đã hủy thao tác.' : 'Yêu cầu không còn hiệu lực.');
    if (cancelled) {
      await ctx.editMessageText(
        this.uiService.formatResultBox('cancelled', { changed: false }, 'CANCELLED', true),
        { parse_mode: 'HTML', ...this.uiService.buildNotificationActionsMarkup() },
      );
    } else {
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    }
  }

  @Action(/^voice:confirm:(.+)$/)
  public async onVoiceConfirmAction(@Ctx() ctx: Context): Promise<void> {
    const requestId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!requestId || !userId) return;
    try {
      const transcript = this.voiceTranscriptionService.consumeTranscript(requestId, userId);
      await ctx.answerCbQuery('Đã xác nhận. Đang gửi trợ lý...');
      await ctx.editMessageText('✅ Đã xác nhận nội dung voice. Đang xử lý...');
      await this.processAgentRequest(ctx, transcript, userId);
    } catch (error) {
      await ctx.answerCbQuery((error as Error).message);
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    }
  }

  @Action(/^voice:edit:(.+)$/)
  public async onVoiceEditAction(@Ctx() ctx: Context): Promise<void> {
    const requestId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!requestId || !userId) return;
    const cancelled = this.voiceTranscriptionService.cancelTranscript(requestId, userId);
    await ctx.answerCbQuery(
      cancelled ? 'Hãy gửi lại nội dung bằng text.' : 'Yêu cầu không còn hiệu lực.',
    );
    if (cancelled) {
      await ctx.editMessageText('✏️ Hãy gửi lại yêu cầu chính xác bằng tin nhắn text.');
    } else {
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    }
  }

  @Action(/^voice:cancel:(.+)$/)
  public async onVoiceCancelAction(@Ctx() ctx: Context): Promise<void> {
    const requestId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!requestId || !userId) return;
    const cancelled = this.voiceTranscriptionService.cancelTranscript(requestId, userId);
    await ctx.answerCbQuery(cancelled ? 'Đã hủy voice.' : 'Yêu cầu không còn hiệu lực.');
    if (cancelled) {
      await ctx.editMessageText('❌ Đã hủy yêu cầu từ voice.');
    } else {
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    }
  }

  @Action('notice:ack')
  public async onNotificationAcknowledge(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Đã hiểu.');
    await ctx.editMessageReplyMarkup(undefined);
  }

  @Action('notice:close')
  public async onNotificationClose(@Ctx() ctx: Context): Promise<void> {
    await this.closeMessage(ctx);
  }

  @Action('action:create_invite')
  public async onCreateInviteAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🎟️ Đang tạo link mời...');
    await this.onInvite(ctx);
  }

  @Action('action:refresh_users')
  public async onRefreshUsersAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang làm mới danh sách user...');
    await this.onListUsers(ctx);
  }

  @Action('action:refresh_status')
  public async onRefreshStatusAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang làm mới trạng thái...');
    await this.onStatus(ctx);
  }

  @On('text')
  public async onTextMessage(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const message = ctx.message;
    const text = message && 'text' in message ? message.text.trim() : '';
    if (!text || !userId) return;

    await this.cancelPendingUserActions(ctx, userId);

    if (this.isDashboardRequest(text)) {
      await this.onDashboard(ctx);
      return;
    }

    // Auto-detect if user simply pasted the redirect callback URL or raw auth code
    if (
      !this.googleAuthService.isAuthorized(userId) &&
      (text.includes('oauth2callback') ||
        text.includes('code=') ||
        (text.startsWith('4/') && text.length > 25))
    ) {
      await this.handleCodeExchange(ctx, userId, text);
      return;
    }

    this.logger.log(`Received text message from ${userId}: "${text}"`);

    await this.processAgentRequest(ctx, text, userId);
  }

  @On('voice')
  public async onVoiceMessage(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const message = ctx.message;
    if (!userId || !message || !('voice' in message)) return;

    await this.cancelPendingUserActions(ctx, userId);

    try {
      const transcript = await this.uiService.withTyping(ctx, () =>
        this.voiceTranscriptionService.transcribe(ctx.telegram, message.voice),
      );
      const requestId = this.voiceTranscriptionService.queueTranscript(userId, transcript);
      const sent = await ctx.reply(this.uiService.formatVoiceConfirmation(transcript), {
        parse_mode: 'HTML',
        ...this.uiService.buildVoiceConfirmationMarkup(requestId),
      });
      if (sent && typeof sent === 'object' && 'message_id' in sent && 'chat' in sent) {
        const msg = sent as { chat: { id: number | string }; message_id: number };
        this.voiceTranscriptionService.attachMessageToPendingVoice(
          requestId,
          msg.chat.id,
          msg.message_id,
        );
      }
    } catch (error) {
      await ctx.reply(`⚠️ ${(error as Error).message}`);
    }
  }

  @On('photo')
  public async onPhotoMessage(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const message = ctx.message;
    if (!userId || !message || !('photo' in message)) return;

    await this.cancelPendingUserActions(ctx, userId);

    try {
      const analysis = await this.uiService.withTyping(ctx, () =>
        this.receiptImageAnalysisService.analyze(ctx.telegram, message.photo),
      );
      if (analysis.kind === 'not_receipt') {
        await ctx.reply(`🖼️ ${analysis.summary}`);
        return;
      }
      if (analysis.kind === 'missing_fields') {
        const missing = analysis.missingFields?.includes('amount') ? 'số tiền' : 'thu hay chi';
        await ctx.reply(`🖼️ ${analysis.summary}\nAnh cho em biết thêm ${missing} nhé.`);
        return;
      }
      await this.requestToolConfirmation(ctx, userId, 'create_finance_transaction', {
        type: analysis.type,
        amount: analysis.amount,
        category: analysis.category || 'Khác',
        note: analysis.note,
        ...(analysis.occurredAt ? { occurredAt: analysis.occurredAt } : {}),
      });
    } catch (error) {
      await ctx.reply(`⚠️ ${(error as Error).message}`);
    }
  }
}
