import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly usersService: UsersService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const telegrafCtx = TelegrafExecutionContext.create(context);
    const ctx = telegrafCtx.getContext<Context>();

    const userId = ctx.from?.id;
    if (!userId) return false;

    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';

    // Allow /start with invite code to proceed to handler for validation
    if (text.startsWith('/start invite_')) {
      return true;
    }

    // STRICT: Check Whitelist Access
    if (!this.usersService.isAllowed(userId)) {
      this.logger.warn(
        `Unauthorized access attempt from user ID: ${userId} (@${ctx.from?.username || 'unknown'})`,
      );

      const hasAdmin: boolean = this.usersService.hasAdminConfigured();
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

    // Check Rate Limiting & Cooldown
    const rateCheck = this.usersService.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      this.logger.warn(`Rate limit triggered for user ${userId}: ${rateCheck.reason}`);
      try {
        await ctx.reply(rateCheck.reason || '⏳ Bạn đang gửi tin nhắn quá nhanh.', {
          parse_mode: 'Markdown',
        });
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(`Failed to send rate limit reply: ${error.message}`);
      }
      return false;
    }

    // Record 1 request usage
    this.usersService.recordUsage(userId);
    return true;
  }
}
