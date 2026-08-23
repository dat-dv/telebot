import { Update, Start, Help, Command, On, Action, Ctx } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { AuthGuard } from './guards/auth.guard';
import { TelegramUiService } from './services/telegram-ui.service';
import { VoiceTranscriptionService } from './services/voice-transcription.service';
import { GeminiService } from '../gemini/gemini.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { GoogleTasksService } from '../google/google-tasks.service';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { RemindersService } from '../reminders/reminders.service';
import { FinanceService } from '../finance/finance.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { ReportsTokenService } from '../reports/reports-token.service';

@Update()
@UseGuards(AuthGuard)
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly tasksService: GoogleTasksService,
    private readonly calendarService: GoogleCalendarService,
    private readonly remindersService: RemindersService,
    private readonly uiService: TelegramUiService,
    private readonly voiceTranscriptionService: VoiceTranscriptionService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly reportsTokens: ReportsTokenService,
  ) {}

  private async getReportsUrl(userId?: number): Promise<string> {
    const appUrl = this.configService.get<string>('appUrl', '').replace(/\/+$/, '');
    if (!appUrl || !userId) return '';
    const token = await this.reportsTokens.issueExchangeToken(userId);
    return `${appUrl}/api/access?token=${encodeURIComponent(token)}`;
  }

  private async requestToolConfirmation(
    ctx: Context,
    userId: number,
    name: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const pending = this.geminiService.queueToolConfirmation(
      name,
      payload,
      userId,
      ctx.botInfo?.username,
    );
    await ctx.reply(
      this.uiService.formatConfirmationBox(pending.name, pending.payload, pending.referenceId),
      { parse_mode: 'HTML', ...this.uiService.buildConfirmationMarkup(pending.id) },
    );
  }

  private async processAgentRequest(ctx: Context, text: string, userId: number): Promise<void> {
    const botUsername = ctx.botInfo?.username;
    const chatResult = await this.uiService.withTyping(ctx, () =>
      this.geminiService.chat(text, [], userId, botUsername),
    );

    if (chatResult.pendingAction) {
      const { name, payload, id, referenceId } = chatResult.pendingAction;
      await ctx.reply(this.uiService.formatConfirmationBox(name, payload, referenceId), {
        parse_mode: 'HTML',
        ...this.uiService.buildConfirmationMarkup(id),
      });
      return;
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

  @Start()
  public async onStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const fromName = ctx.from?.first_name || 'bạn';
    const isAdmin = this.usersService.isAdmin(userId);
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';

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
Tôi là trợ lý AI cá nhân kết nối trực tiếp với *Google Calendar*, *Google Tasks* & *Nhắc Nhở Tự Động*.

${googleStatus}
━━━━━━━━━━━━━━━━━━━━
📱 *Bạn có thể bấm các nút chức năng bên dưới hoặc nhắn tin tự nhiên:*
• ⏰ _"15 phút nữa nhắc anh tắt bếp"_
• 📅 _"Chiều mai 14h họp dự án với sếp"_
• 📝 _"Nhắc anh mua quà sinh nhật cho vợ"_
• 📊 _"Hôm nay anh có lịch gì không?"_`;

    const inlineMarkup = this.uiService.buildMainMenuInlineMarkup(
      isAdmin,
      isGoogleConnected,
      authUrl,
      await this.getReportsUrl(userId),
    );

    await this.uiService.sendSafeReply(ctx, welcomeMessage, inlineMarkup);
  }

  @Help()
  @Command('help')
  public async onHelp(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
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
      await this.getReportsUrl(userId),
    );

    if (isAdmin) {
      const adminHelpMessage = `👑 *HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)*
━━━━━━━━━━━━━━━━━━━━

1️⃣ *LỜI NHẮC & GỌI ĐIỆN TỰ ĐỘNG (REMINDERS)*
• ⏰ _"15 phút nữa nhắc anh tắt bếp"_ ➔ Bot gửi tin nhắn
• 📞 _"8h tối nay gọi nhá máy nhắc anh"_ ➔ Bot gọi đổ chuông

2️⃣ *LỊCH HẸN GOOGLE CALENDAR*
• 📅 _"Mai 14h họp kickoff dự án với khách hàng"_
• 🔔 Tự động cài 4 mốc chuông báo popup dồn dập

3️⃣ *DANH SÁCH VIỆC CẦN LÀM (TO-DO TASKS)*
• 📝 _"Thêm việc chuẩn bị tài liệu thuyết trình"_
• 📋 Bấm nút xem danh sách & tick hoàn thành 1-chạm

4️⃣ *CÔNG CỤ QUẢN TRỊ HỆ THỐNG*
• 🎟️ *Tạo Link Mời*: Bấm nút bên dưới (hoặc nhắn _"Tạo link mời"_)
• 👥 *Xem Danh Sách*: Bấm nút bên dưới (hoặc nhắn _"Xem danh sách user"_)
• 🚫 *Khóa Tài Khoản*: Gõ \`/ban <id>\` (hoặc nhắn _"Ban user <id>"_)

━━━━━━━━━━━━━━━━━━━━
💡 *Mẹo:* Bạn chỉ cần nhắn tin tự nhiên, nếu muốn sửa đổi chỉ cần nhắn lại cho AI!`;

      await this.uiService.sendSafeReply(ctx, adminHelpMessage, inlineMarkup);
      return;
    }

    // Regular Member Help Message
    const userHelpMessage = `📖 *HƯỚNG DẪN SỬ DỤNG TRỢ LÝ CÁ NHÂN*
━━━━━━━━━━━━━━━━━━━━

1️⃣ *LỜI NHẮC & GỌI ĐIỆN TỰ ĐỘNG (REMINDERS)*
• ⏰ _"15 phút nữa nhắc anh tắt bếp"_ ➔ Bot gửi tin nhắn
• 📞 _"8h tối nay gọi nhá máy nhắc tớ"_ ➔ Bot gọi đổ chuông

2️⃣ *LỊCH HẸN GOOGLE CALENDAR*
• 📅 _"Mai 14h họp dự án tại phòng họp A"_
• 🔔 Tự động cài 4 mốc chuông báo popup dồn dập

3️⃣ *DANH SÁCH VIỆC CẦN LÀM (TO-DO TASKS)*
• 📝 _"Thêm việc chuẩn bị slide báo cáo"_
• 📋 Mở to-do list & bấm nút tick hoàn thành 1-chạm

━━━━━━━━━━━━━━━━━━━━
💡 *Mẹo:* Bạn chỉ cần nhắn tin tự nhiên, nếu muốn sửa đổi chỉ cần nhắn lại cho bot!`;

    await this.uiService.sendSafeReply(ctx, userHelpMessage, inlineMarkup);
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
      const inlineMarkup = this.uiService.buildMainMenuInlineMarkup(
        isAdmin,
        true,
        '',
        await this.getReportsUrl(userId),
      );

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

    const inlineButtons = isGoogleConnected
      ? [[Markup.button.callback('🔄 Kiểm tra lại', 'action:refresh_status')]]
      : [
          [
            Markup.button.url(
              '🔗 Đăng nhập Google ngay',
              this.googleAuthService.generateAuthUrl(userId),
            ),
          ],
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
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getTodaySummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary, this.uiService.buildTodayActionsMarkup());
  }

  @Command('week')
  public async onWeek(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getWeekSummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary, this.uiService.buildTodayActionsMarkup());
  }

  @Command('finance')
  @Command('money')
  public async onFinance(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const { startAt, endAt } = this.financeService.getTodayRange();
    const summary = await this.financeService.getSummary(userId, startAt, endAt);
    const transactionLines = summary.transactions.slice(0, 8).map((transaction) => {
      const icon = transaction.type === 'income' ? '➕' : '➖';
      return `${icon} ${transaction.note} — ${this.financeService.formatMoney(transaction.amount)}`;
    });
    const details = transactionLines.length > 0 ? `\n\n${transactionLines.join('\n')}` : '';

    await ctx.reply(
      `💰 SỔ THU–CHI HÔM NAY\n\nThu: ${this.financeService.formatMoney(summary.income)}\nChi: ${this.financeService.formatMoney(summary.expense)}\nCòn lại: ${this.financeService.formatMoney(summary.balance)}${details}\n\nNhắn ví dụ: “ăn trưa 65k” hoặc “nhận lương 20 triệu”.`,
    );
  }

  @Command('history')
  public async onHistory(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;
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
  public async onTasksChecklist(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      const tasks = await this.uiService.withTyping(ctx, () =>
        this.tasksService.listTasks({ showCompleted: false, maxResults: 15 }, userId),
      );

      if (tasks.length === 0) {
        await ctx.reply(
          '🎉 *Tuyệt vời!* Bạn hiện không có công việc to-do nào chưa hoàn thành.\n\nNhắn cho tôi: _"Nhắc anh chuẩn bị báo cáo ngày mai"_ để thêm việc mới nhé!',
          { parse_mode: 'Markdown' },
        );
        return;
      }

      let taskListText = `📝 *DANH SÁCH VIỆC CẦN LÀM (${tasks.length}):*\n\n`;
      tasks.slice(0, 10).forEach((t, index) => {
        const dueText = t.due ? ` _(Hạn: ${t.due.slice(0, 10)})_` : '';
        taskListText += `▫️ *#${index + 1}*: ${t.title}${dueText}\n`;
      });
      taskListText += `\n👉 *Bấm vào các nút bên dưới để đánh dấu đã làm xong:*`;

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
      return;

      // Fetch remaining tasks and update message
      const remainingTasks = await this.tasksService.listTasks(
        { showCompleted: false, maxResults: 15 },
        userId,
      );

      if (remainingTasks.length === 0) {
        await ctx.editMessageText(
          '🎉 *Chúc mừng bạn đã hoàn thành tất cả công việc to-do!*\n\nNhắn tin bất kỳ lúc nào để thêm việc mới nhé.',
          { parse_mode: 'Markdown' },
        );
      } else {
        let taskListText = `📝 *DANH SÁCH VIỆC CẦN LÀM (${remainingTasks.length}):*\n\n`;
        remainingTasks.slice(0, 10).forEach((t, index) => {
          const dueText = t.due ? ` _(Hạn: ${t.due.slice(0, 10)})_` : '';
          taskListText += `▫️ *#${index + 1}*: ${t.title}${dueText}\n`;
        });
        taskListText += `\n👉 *Bấm vào các nút bên dưới để đánh dấu đã làm xong:*`;

        const checklistMarkup = this.uiService.buildTaskChecklistMarkup(remainingTasks);
        await ctx.editMessageText(taskListText, {
          parse_mode: 'Markdown',
          ...checklistMarkup,
        });
      }
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
    return;

    const isCall = targetType === 'call';
    await ctx.answerCbQuery(
      isCall
        ? '📞 Đã chuyển sang hình thức: Gọi Nhá Máy (CallMe)!'
        : '💬 Đã chuyển sang hình thức: Nhắn Tin (TextMe)!',
    );

    const updatedMarkup = this.uiService.buildReminderConfirmationMarkup(reminderId, targetType);

    try {
      await ctx.editMessageReplyMarkup(updatedMarkup.reply_markup);
    } catch {
      // ignore
    }
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
    return;

    await ctx.answerCbQuery('🗑️ Đã hủy lời nhắc thành công.');
    try {
      await ctx.editMessageText('❌ *ĐÃ HỦY LỜI NHẮC NÀY THÀNH CÔNG.*', {
        parse_mode: 'Markdown',
      });
    } catch {
      // ignore
    }
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
    return;

    await ctx.answerCbQuery('✅ Tuyệt vời! Đã hoàn thành lời nhắc.');
    try {
      await ctx.editMessageText('✅ *ĐÃ HOÀN THÀNH LỜI NHẮC!*\n\nCảm ơn bạn đã xác nhận.', {
        parse_mode: 'Markdown',
      });
    } catch {
      // ignore
    }
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
    return;

    await ctx.answerCbQuery(`⏳ Đã hoãn lại ${minutes} phút!`);
    try {
      await ctx.editMessageText(
        `⏳ *ĐÃ HOÃN LỜI NHẮC THÊM ${minutes} PHÚT!*\n\nBot sẽ tự động "Ting Ting" nhắc lại cho bạn sau ${minutes} phút nữa nhé.`,
        { parse_mode: 'Markdown' },
      );
    } catch {
      // ignore
    }
  }

  @Action('action:refresh_today')
  public async onRefreshTodayAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang cập nhật lịch trình...');
    await this.onToday(ctx);
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

  @Action('action:view_reports')
  public async onViewReportsAction(@Ctx() ctx: Context): Promise<void> {
    const reportsUrl = await this.getReportsUrl(ctx.from?.id);
    if (!reportsUrl) {
      await ctx.answerCbQuery('Chưa cấu hình trang báo cáo trên server.');
      return;
    }
    await ctx.answerCbQuery('Đang mở báo cáo...');
    await ctx.reply(
      '📊 Mở trang báo cáo tài chính:',
      Markup.inlineKeyboard([[Markup.button.url('📊 Xem báo cáo', reportsUrl)]]),
    );
  }

  @Action(/^debt:pay:(.+)$/)
  public async onDebtPayAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Nhắn số tiền đã trả, ví dụ: “Trí trả anh 200k”.');
    await ctx.reply('💵 Nhắn số tiền đã trả, ví dụ: “Trí trả anh 200k”.');
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
      await ctx.answerCbQuery('Đã xác nhận và thực hiện.');
      await ctx.editMessageText(this.uiService.formatResultBox(name, result, referenceId), {
        parse_mode: 'HTML',
        ...this.uiService.buildNotificationActionsMarkup(),
      });
    } catch (error) {
      await ctx.answerCbQuery((error as Error).message);
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
    if (cancelled)
      await ctx.editMessageText('✏️ Hãy gửi lại yêu cầu chính xác bằng tin nhắn text.');
  }

  @Action(/^voice:cancel:(.+)$/)
  public async onVoiceCancelAction(@Ctx() ctx: Context): Promise<void> {
    const requestId = (ctx as { match?: RegExpExecArray }).match?.[1];
    const userId = ctx.from?.id;
    if (!requestId || !userId) return;
    const cancelled = this.voiceTranscriptionService.cancelTranscript(requestId, userId);
    await ctx.answerCbQuery(cancelled ? 'Đã hủy voice.' : 'Yêu cầu không còn hiệu lực.');
    if (cancelled) await ctx.editMessageText('❌ Đã hủy yêu cầu từ voice.');
  }

  @Action('notice:ack')
  public async onNotificationAcknowledge(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Đã hiểu.');
    await ctx.editMessageReplyMarkup(undefined);
  }

  @Action('notice:close')
  public async onNotificationClose(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Đã đóng.');
    try {
      await ctx.deleteMessage();
    } catch {
      await ctx.editMessageReplyMarkup(undefined);
    }
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
    if (!text) return;

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

    try {
      const transcript = await this.uiService.withTyping(ctx, () =>
        this.voiceTranscriptionService.transcribe(ctx.telegram, message.voice),
      );
      const requestId = this.voiceTranscriptionService.queueTranscript(userId, transcript);
      await ctx.reply(this.uiService.formatVoiceConfirmation(transcript), {
        parse_mode: 'HTML',
        ...this.uiService.buildVoiceConfirmationMarkup(requestId),
      });
    } catch (error) {
      await ctx.reply(`⚠️ ${(error as Error).message}`);
    }
  }
}
