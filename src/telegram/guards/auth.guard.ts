import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const telegrafCtx = TelegrafExecutionContext.create(context);
    const ctx = telegrafCtx.getContext<Context>();

    const allowedUserIds = this.configService.get<number[]>('telegram.allowedUserIds', []);

    // If allowedUserIds list is empty, allow all users (public mode)
    if (!allowedUserIds || allowedUserIds.length === 0) {
      return true;
    }

    const userId = ctx.from?.id;

    if (!userId || !allowedUserIds.includes(userId)) {
      this.logger.warn(
        `Unauthorized access attempt from user ID: ${userId} (@${ctx.from?.username || 'unknown'})`,
      );
      try {
        await ctx.reply(
          `⛔ Xin lỗi, bạn không có quyền truy cập vào trợ lý bot cá nhân này.\n\n🆔 User ID của bạn: \`${userId}\`\nVui lòng thêm ID này vào biến môi trường \`TELEGRAM_ALLOWED_USER_IDS\` trên server.`,
          { parse_mode: 'Markdown' },
        );
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(`Failed to send unauthorized reply: ${error.message}`);
      }
      return false;
    }

    return true;
  }
}
