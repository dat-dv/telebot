import { Update, Start, Help, Command, On, Ctx } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { AuthGuard } from './guards/auth.guard';
import { GeminiService } from '../gemini/gemini.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from '../google/google-auth.service';

@Update()
@UseGuards(AuthGuard)
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Start()
  public async onStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const fromName = ctx.from?.first_name || 'bạn';
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
          '💡 *Mẹo:* Sau khi đăng nhập và bấm Cho phép, bạn chỉ cần copy mã xác thực hoặc dán thẳng toàn bộ đường link trình duyệt vào đây là xong nhé!',
          { parse_mode: 'Markdown' },
        );
      } else {
        await ctx.reply(
          activatedMessage + '\n\nGõ lệnh `/login` để nhận đường link kết nối Google nhé!',
          { parse_mode: 'Markdown' },
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

🚀 *Các lệnh nhanh hỗ trợ:*
• \`/today\` - Tóm tắt toàn bộ lịch hẹn & to-do list hôm nay
• \`/week\` - Tổng quan lịch trình & việc cần làm 7 ngày tới
• \`/calendar <nội dung>\` - Lên lịch hẹn mới nhanh chóng
• \`/task <nội dung>\` - Thêm công việc to-do mới
• \`/login\` - Kết nối tài khoản Google cá nhân
• \`/status\` - Kiểm tra trạng thái tài khoản
• \`/help\` - Xem hướng dẫn chi tiết

💬 Hoặc bạn chỉ cần *nhắn tin tự nhiên* bất kỳ lúc nào (ví dụ: _"Chiều mai 3h nhắc tớ họp dự án với team nhé"_). AI sẽ tự động phân tích và phục vụ riêng cho bạn!`;

    await this.sendSafeReply(ctx, welcomeMessage);
  }

  @Help()
  @Command('help')
  public async onHelp(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const isAdmin = userId ? this.usersService.isAdmin(userId) : false;

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

3️⃣ *Các Lệnh Tiện Ích:*
• \`/login\` hoặc \`/auth\` - Lấy link kết nối Google Calendar riêng của bạn
• \`/code <mã>\` - Hoàn tất kết nối Google bằng mã Authorization
• \`/status\` - Kiểm tra trạng thái tài khoản & Google
• \`/today\` - Xem tất cả lịch và task hôm nay
• \`/week\` - Xem tổng thể 7 ngày sắp tới
• \`/calendar <lời nhắc>\` - Tạo lịch hẹn nhanh
• \`/task <công việc>\` - Thêm to-do nhanh`;

    if (isAdmin) {
      helpMessage += `\n\n👑 *LỆNH DÀNH CHO QUẢN TRỊ VIÊN (ADMIN):*
• \`/invite\` - Tạo link mời người dùng mới (có hạn 24h)
• \`/users\` - Xem danh sách người dùng đang hoạt động
• \`/allow <id>\` - Cấp quyền trực tiếp cho một Telegram ID
• \`/ban <id>\` - Thu hồi quyền của một Telegram ID`;
    }

    await this.sendSafeReply(ctx, helpMessage);
  }

  @Command('invite')
  public async onInvite(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên (Admin) mới có quyền tạo link mời.');
      return;
    }

    const invite = await this.usersService.createInvite(userId);
    const botUsername = ctx.botInfo.username;
    const inviteLink = `https://t.me/${botUsername}?start=${invite.code}`;

    const msg = `🎟️ *TẠO LINK MỜI THÀNH CÔNG!*\n\nBạn có thể gửi đường link này cho bạn bè/đồng nghiệp:\n👉 \`${inviteLink}\`\n\n⏳ *Lưu ý:* Link có hiệu lực trong **24 giờ** và **chỉ dùng được 1 lần**. Khi bạn của bạn nhấn link, họ sẽ tự động được mở khóa và có trợ lý riêng!`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
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
        ? '*(Hiện tại bạn ĐÃ kết nối Google, bấm nút bên dưới nếu muốn đăng nhập lại tài khoản khác)*'
        : '*(Hiện tại bạn CHƯA kết nối tài khoản Google)*';

      const msg = `🔐 *KẾT NỐI GOOGLE CALENDAR & TASKS*\n\n${statusText}\n\n1️⃣ Nhấn vào nút bên dưới để mở trang đăng nhập Google.\n2️⃣ Chọn tài khoản Gmail của bạn và nhấn **Cho phép (Allow)**.\n3️⃣ Copy mã xác thực (hoặc dán thẳng đường link sau khi đăng nhập) gửi lại cho bot nhé!`;

      await ctx.reply(
        msg,
        Markup.inlineKeyboard([[Markup.button.url('🔗 Đăng nhập Google', authUrl)]]),
      );
    } catch (err) {
      const error = err as Error;
      await ctx.reply(`⚠️ Lỗi tạo link đăng nhập: ${error.message}`);
    }
  }

  private extractAuthCode(input: string): string {
    let cleaned = input.trim();
    // If user pasted redirect callback URL (e.g. http://localhost:3000/oauth2callback?code=4/0ATs...)
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

  private async handleCodeExchange(ctx: Context, userId: number, rawInput: string): Promise<void> {
    const code = this.extractAuthCode(rawInput);
    if (!code) {
      await ctx.reply(
        'ℹ️ Vui lòng nhập mã xác thực hoặc dán đường link. Ví dụ:\n`/code 4/0AQ...`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    try {
      await this.withTyping(ctx, async () => {
        await this.googleAuthService.exchangeCodeForTokens(userId, code);
      });

      await ctx.reply(
        '🎉 *KẾT NỐI GOOGLE THÀNH CÔNG!*\n\nTài khoản Google Calendar & Google Tasks của bạn đã sẵn sàng. Bây giờ bạn có thể nhắn tin cho bot để quản lý lịch trình và việc cần làm rồi nhé!',
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      const error = err as Error;
      await ctx.reply(
        `❌ *Xác thực thất bại:* Mã xác thực không hợp lệ hoặc đã hết hạn.\nVui lòng gõ \`/login\` để lấy link đăng nhập mới.\nChi tiết: \`${error.message}\``,
        { parse_mode: 'Markdown' },
      );
    }
  }

  @Command('code')
  public async onCode(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    await this.handleCodeExchange(ctx, userId, text);
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
🔗 *Google Workspace*: ${isGoogleConnected ? '✅ Đã kết nối (Calendar & Tasks sẵn sàng)' : '❌ Chưa kết nối (gõ `/login` để liên kết)'}

💡 Gõ \`/help\` để xem danh sách các câu lệnh và hướng dẫn sử dụng.`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
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

    await ctx.reply(listText, { parse_mode: 'Markdown' });
  }

  @Command('allow')
  public async onAllowUser(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.usersService.isAdmin(userId)) {
      await ctx.reply('⛔ Chỉ Quản trị viên mới có thể cấp quyền.');
      return;
    }

    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const targetIdStr = text.replace(/^\/allow\s*/i, '').trim();
    const targetId = Number(targetIdStr);

    if (!targetId || isNaN(targetId)) {
      await ctx.reply('ℹ️ Cú pháp: `/allow <telegram_user_id>`', { parse_mode: 'Markdown' });
      return;
    }

    await this.usersService.allowUser(targetId);
    await ctx.reply(`✅ Đã cấp quyền sử dụng cho User ID \`${targetId}\`.`, {
      parse_mode: 'Markdown',
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

    const success = await this.usersService.banUser(targetId);
    if (success) {
      await ctx.reply(`🚫 Đã thu hồi quyền sử dụng của User ID \`${targetId}\`.`, {
        parse_mode: 'Markdown',
      });
    } else {
      await ctx.reply(`⚠️ Không tìm thấy User ID \`${targetId}\` trong danh sách.`, {
        parse_mode: 'Markdown',
      });
    }
  }

  @Command('today')
  public async onToday(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const summary = await this.withTyping(ctx, () => this.geminiService.getTodaySummary(userId));
    await this.sendSafeReply(ctx, summary);
  }

  @Command('week')
  public async onWeek(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const summary = await this.withTyping(ctx, () => this.geminiService.getWeekSummary(userId));
    await this.sendSafeReply(ctx, summary);
  }

  @Command('calendar')
  public async onCalendar(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const query = text.replace(/^\/calendar(@\w+)?\s*/i, '').trim();

    if (!query) {
      await ctx.reply(
        'ℹ️ Vui lòng nhập nội dung lịch hẹn sau lệnh. Ví dụ:\n`/calendar Họp khách hàng lúc 15h chiều mai tại Quận 1`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const prompt = `Hãy tạo một sự kiện trên Google Calendar dựa trên yêu cầu sau: "${query}"`;
    const response = await this.withTyping(ctx, () => this.geminiService.chat(prompt, [], userId));
    await this.sendSafeReply(ctx, response);
  }

  @Command('task')
  public async onTask(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const query = text.replace(/^\/task(@\w+)?\s*/i, '').trim();

    if (!query) {
      await ctx.reply(
        'ℹ️ Vui lòng nhập nội dung công việc sau lệnh. Ví dụ:\n`/task Mua tài liệu ôn thi cuối kỳ`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const prompt = `Hãy thêm một công việc mới vào Google Tasks dựa trên yêu cầu sau: "${query}"`;
    const response = await this.withTyping(ctx, () => this.geminiService.chat(prompt, [], userId));
    await this.sendSafeReply(ctx, response);
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

    const response = await this.withTyping(ctx, () => this.geminiService.chat(text, [], userId));
    await this.sendSafeReply(ctx, response);
  }

  /**
   * Helper that executes an asynchronous action while maintaining a continuous
   * Telegram 'typing' status action (refreshed every 4 seconds) so the user
   * always sees that the bot is actively processing.
   */
  private async withTyping<T>(ctx: Context, action: () => Promise<T>): Promise<T> {
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
   * Helper safely sending replies with fallback for Markdown parsing errors & chunking large texts
   */
  private async sendSafeReply(ctx: Context, text: string): Promise<void> {
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

    for (const chunk of chunks) {
      try {
        await ctx.reply(chunk, { parse_mode: 'Markdown' });
      } catch (markdownError) {
        const err = markdownError as Error;
        this.logger.warn(`Markdown reply failed, falling back to plain text: ${err.message}`);
        await ctx.reply(chunk);
      }
    }
  }
}
