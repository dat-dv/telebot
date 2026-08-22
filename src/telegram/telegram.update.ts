import { Update, Start, Help, Command, On, Hears, Action, Ctx } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { AuthGuard } from './guards/auth.guard';
import { TelegramUiService } from './services/telegram-ui.service';
import { GeminiService } from '../gemini/gemini.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { GoogleTasksService } from '../google/google-tasks.service';
import { GoogleCalendarService } from '../google/google-calendar.service';

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
    private readonly uiService: TelegramUiService,
  ) {}

  @Start()
  public async onStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const fromName = ctx.from?.first_name || 'bạn';
    const isAdmin = this.usersService.isAdmin(userId);
    const menuKeyboard = this.uiService.getMainMenuKeyboard(isAdmin);
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';

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

      let authUrl = '';
      try {
        authUrl = this.googleAuthService.generateAuthUrl(userId);
      } catch {
        // ignore
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
          { parse_mode: 'Markdown', ...menuKeyboard },
        );
      } else {
        await ctx.reply(
          activatedMessage + '\n\nGõ lệnh `/login` để nhận đường link kết nối Google nhé!',
          { parse_mode: 'Markdown', ...menuKeyboard },
        );
      }
      return;
    }

    // Normal /start
    const isGoogleConnected = this.googleAuthService.isAuthorized(userId);
    const googleStatus = isGoogleConnected
      ? '✅ *Tài khoản Google*: Đã kết nối'
      : '⚠️ *Tài khoản Google*: Chưa kết nối (Gõ `/login` để liên kết)';

    const welcomeMessage = `👋 Xin chào *${fromName}*! Tôi là trợ lý AI cá nhân kết nối trực tiếp với *Google Calendar* và *Google Tasks*.

${googleStatus}

📱 *Bạn có thể bấm các nút bên dưới hoặc nhắn tin tự nhiên:*
• _"Chiều mai 14h họp dự án với sếp"_
• _"Nhắc anh mua quà sinh nhật cho vợ vào ngày mai"_
• _"Hôm nay anh có lịch gì không?"_`;

    await this.uiService.sendSafeReply(ctx, welcomeMessage, menuKeyboard);
  }

  @Help()
  @Command('help')
  public async onHelp(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const isAdmin = userId ? this.usersService.isAdmin(userId) : false;
    const menuKeyboard = this.uiService.getMainMenuKeyboard(isAdmin);

    let helpMessage = `📖 *HƯỚNG DẪN SỬ DỤNG TRỢ LÝ AI CÁ NHÂN*

1️⃣ *Quản lý Google Calendar (Lịch hẹn / Họp có giờ cố định)*
• _"Mai 14h họp kickoff dự án tại phòng họp A"_
• _"Thứ 6 tuần này từ 9h đến 11h đi khám sức khỏe"_
• _"Hôm nay tớ có lịch gì không?"_
• _"Xóa lịch họp lúc 14h chiều mai"_
• Tự động cài 4 mốc chuông popup báo dồn dập (60p, 30p, 10p, 0p) 🔔

2️⃣ *Quản lý Google Tasks (To-Do List / Việc cần làm)*
• _"Thêm việc chuẩn bị tài liệu thuyết trình"_
• _"Nhắc tớ đi siêu thị mua trứng và sữa trước chủ nhật"_
• _"Xem danh sách việc cần làm của tớ"_
• _"Đánh dấu đã hoàn thành việc mua sách"_

3️⃣ *Các Phím Chức Năng Nhanh (Dưới Bàn Phím):*
• 📅 *Lịch Hôm Nay* - Xem toàn bộ lịch trình hôm nay
• 📝 *Việc Cần Làm* - Xem to-do list & bấm nút tick hoàn thành ngay
• 📊 *Xem 7 Ngày Tới* - Tổng quan lịch 7 ngày
• ⚙️ *Trạng Thái* - Kiểm tra kết nối tài khoản`;

    if (isAdmin) {
      helpMessage += `\n\n👑 *DÀNH CHO QUẢN TRỊ VIÊN (ADMIN):*
• 👥 *Danh Sách User* - Xem thành viên đang hoạt động
• 🎟️ *Tạo Link Mời* - Sinh link mời 24h cho bạn bè (hoặc nhắn _"Tạo link mời"_ cho AI)
• \`/ban <id>\` - Thu hồi quyền & hủy token của một Telegram ID`;
    }

    await this.uiService.sendSafeReply(ctx, helpMessage, menuKeyboard);
  }

  @Command('invite')
  @Hears('🎟️ Tạo Link Mời')
  public async onInvite(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên (Admin) mới có quyền tạo link mời.');
      return;
    }

    const invite = await this.usersService.createInvite(userId);
    const botUsername = ctx.botInfo.username;
    const inviteLink = `https://t.me/${botUsername}?start=${invite.code}`;

    const msg = `🎟️ *TẠO LINK MỜI THÀNH CÔNG!*\n\nBạn có thể gửi đường link này cho bạn bè/đồng nghiệp:\n👉 \`${inviteLink}\`\n\n⏳ *Lưu ý:* Link có hiệu lực trong **24 giờ** và **chỉ dùng được 1 lần**. Khi bạn bè nhấn link, họ sẽ được kích hoạt trợ lý riêng tự động!`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.url('👉 Thử Mở Link Mời', inviteLink)]]),
    });
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
      await ctx.reply(
        '🎉 *KẾT NỐI GOOGLE THÀNH CÔNG!*\n\nTài khoản Google Calendar & Google Tasks của bạn đã sẵn sàng. Bây giờ bạn có thể sử dụng các nút bấm bên dưới hoặc nhắn tin tự nhiên cho bot nhé!',
        { parse_mode: 'Markdown', ...this.uiService.getMainMenuKeyboard(isAdmin) },
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
  @Hears('⚙️ Trạng Thái')
  public async onStatus(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const fromName = ctx.from?.first_name || 'bạn';
    const isGoogleConnected = this.googleAuthService.isAuthorized(userId);
    const isAdmin = this.usersService.isAdmin(userId);

    const msg = `📊 *TRẠNG THÁI TÀI KHOẢN*

👤 *Người dùng*: *${fromName}* (\`${userId}\`)
👑 *Vai trò*: ${isAdmin ? '👑 Quản trị viên (Admin)' : '👤 Người dùng (Member)'}
🔗 *Google Workspace*: ${isGoogleConnected ? '✅ Đã kết nối (Calendar & Tasks sẵn sàng)' : '❌ Chưa kết nối (gõ `/login` để liên kết)'}

💡 *Mẹo:* Bạn có thể chạm vào các nút ở bàn phím bên dưới để xem nhanh lịch trình hoặc việc cần làm.`;

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
  @Hears('👥 Danh Sách User')
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

    if (this.usersService.isAdmin(targetId)) {
      await ctx.reply('⚠️ Không thể khóa tài khoản Quản trị viên (Admin).', {
        parse_mode: 'Markdown',
      });
      return;
    }

    const success = await this.usersService.banUser(targetId);
    await this.googleAuthService.revokeUserTokens(targetId);

    if (success) {
      await ctx.reply(
        `🚫 Đã khóa vĩnh viễn quyền truy cập và hủy toàn bộ Token Google của User ID \`${targetId}\`.`,
        {
          parse_mode: 'Markdown',
        },
      );
    } else {
      await ctx.reply(`⚠️ Không tìm thấy User ID \`${targetId}\` trong danh sách người dùng.`, {
        parse_mode: 'Markdown',
      });
    }
  }

  @Command('today')
  @Hears('📅 Lịch Hôm Nay')
  public async onToday(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getTodaySummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary, this.uiService.buildTodayActionsMarkup());
  }

  @Command('week')
  @Hears('📊 Xem 7 Ngày Tới')
  public async onWeek(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const botUsername = ctx.botInfo?.username;
    const summary = await this.uiService.withTyping(ctx, () =>
      this.geminiService.getWeekSummary(userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, summary);
  }

  @Hears('📝 Việc Cần Làm')
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
      await this.tasksService.completeTask(taskId, '@default', userId);
      await ctx.answerCbQuery('✅ Đã đánh dấu hoàn thành công việc!');

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

  @Action('action:refresh_today')
  public async onRefreshTodayAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('🔄 Đang cập nhật lịch trình...');
    await this.onToday(ctx);
  }

  @Action('action:view_tasks')
  public async onViewTasksAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('📝 Đang tải danh sách công việc...');
    await this.onTasksChecklist(ctx);
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

    const botUsername = ctx.botInfo?.username;
    const response = await this.uiService.withTyping(ctx, () =>
      this.geminiService.chat(text, [], userId, botUsername),
    );
    await this.uiService.sendSafeReply(ctx, response);
  }
}
