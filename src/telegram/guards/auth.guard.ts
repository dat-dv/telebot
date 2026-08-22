import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { GoogleAuthService } from '../../google/google-auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const telegrafCtx = TelegrafExecutionContext.create(context);
    const ctx = telegrafCtx.getContext<Context>();

    const userId = ctx.from?.id;
    if (!userId) return false;

    const message = ctx.message;
    const text = message && 'text' in message ? message.text.trim() : '';

    // Allow /start with invite code to proceed to handler for validation
    if (text.startsWith('/start invite_')) {
      return true;
    }

    // 1. STRICT: Check Whitelist Access
    if (!this.usersService.isAllowed(userId)) {
      this.logger.warn(
        `Unauthorized access attempt from user ID: ${userId} (@${ctx.from?.username || 'unknown'})`,
      );

      const hasAdmin = this.usersService.hasAdminConfigured();
      let replyMessage = '';

      if (!hasAdmin) {
        replyMessage = `🔒 *HỆ THỐNG ĐANG Ở CHẾ ĐỘ BẢO MẬT NGHIÊM NGẶT!*\n\nBot hiện chưa có Quản trị viên (Admin) nào được thiết lập.\n🆔 **User ID của bạn**: \`${userId}\`\n\n👉 Vui lòng điền ID này vào biến \`TELEGRAM_ADMIN_ID\` trên server để kích hoạt quyền Admin.`;
      } else {
        replyMessage = `⛔ *Truy cập bị từ chối!*\n\nBạn chưa có quyền sử dụng trợ lý này.\n🆔 **User ID của bạn**: \`${userId}\`\n\n📌 Vui lòng liên hệ Quản trị viên (Admin) để nhận đường link mời kích hoạt (\`/invite\`).`;
      }

      try {
        await ctx.reply(replyMessage, { parse_mode: 'Markdown' });
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(`Failed to send unauthorized reply: ${error.message}`);
      }
      return false;
    }

    // 2. Anti-spam cooldown (2s)
    const cooldownCheck = this.usersService.checkCooldown(userId);
    if (!cooldownCheck.allowed) {
      this.logger.warn(`Cooldown triggered for user ${userId}: ${cooldownCheck.reason}`);
      try {
        await ctx.reply(cooldownCheck.reason || '⏳ Bạn đang gửi tin nhắn quá nhanh.', {
          parse_mode: 'Markdown',
        });
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(`Failed to send cooldown reply: ${error.message}`);
      }
      return false;
    }

    // 3. PRIVATE GUARD: Require Google Login for all regular chats & non-auth commands
    const isGoogleAuth = this.googleAuthService.isAuthorized(userId);
    if (!isGoogleAuth) {
      const isAuthCommandOrPayload =
        text.startsWith('/start') ||
        text.startsWith('/login') ||
        text.startsWith('/auth') ||
        text.startsWith('/code') ||
        text.startsWith('/help') ||
        text.startsWith('/status') ||
        text.startsWith('/invite') ||
        text.startsWith('/users') ||
        text.startsWith('/allow') ||
        text.startsWith('/ban') ||
        text.includes('code=') ||
        text.includes('oauth2callback') ||
        text.startsWith('4/');

      if (!isAuthCommandOrPayload) {
        this.logger.warn(`User ${userId} attempted to use bot without Google authentication.`);

        let authUrl = '';
        try {
          authUrl = this.googleAuthService.generateAuthUrl(userId);
        } catch {
          // ignore
        }

        const promptMessage = `🔐 *YÊU CẦU KẾT NỐI TÀI KHOẢN GOOGLE*\n\nĐể sử dụng trợ lý AI (Google Calendar & Google Tasks), bạn cần kết nối tài khoản Google của mình trước.\n\n1️⃣ Nhấn vào nút **"🔗 Đăng nhập Google"** bên dưới.\n2️⃣ Chọn tài khoản Gmail của bạn và nhấn **Cho phép (Allow)**.\n3️⃣ Copy mã xác thực (hoặc dán toàn bộ đường link sau khi đăng nhập) gửi lại cho bot nhé!`;

        try {
          if (authUrl) {
            await ctx.reply(
              promptMessage,
              Markup.inlineKeyboard([[Markup.button.url('🔗 Đăng nhập Google', authUrl)]]),
            );
          } else {
            await ctx.reply(promptMessage, { parse_mode: 'Markdown' });
          }
        } catch (err: unknown) {
          const error = err as Error;
          this.logger.error(`Failed to send login prompt: ${error.message}`);
        }
        return false;
      }
    }

    return true;
  }
}
