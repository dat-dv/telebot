import { Controller, Get, Query, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { GoogleAuthService } from './google-auth.service';
import { renderSuccessHtml, renderErrorHtml } from './templates/oauth-html.template';

@Controller()
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @Get()
  public getHealth(): string {
    return '🟢 Telebot Assistant is up and running!';
  }

  @Get(['oauth2callback', 'auth/google/callback', 'callback'])
  public async handleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const userId = state ? Number(state) : NaN;

    if (error || !code) {
      this.logger.error(`Google OAuth callback error: ${error || 'Missing authorization code'}`);
      res.status(400).send(renderErrorHtml(error || 'Không nhận được mã xác thực từ Google.'));
      return;
    }

    if (!userId || isNaN(userId)) {
      this.logger.error(`Google OAuth callback invalid state (userId): ${state}`);
      res
        .status(400)
        .send(
          renderErrorHtml('Không tìm thấy thông tin định danh người dùng Telegram (State ID).'),
        );
      return;
    }

    try {
      await this.googleAuthService.exchangeCodeForTokens(userId, code);
      this.logger.log(`Google OAuth callback completed successfully for user ${userId}`);

      // Notify the user on Telegram
      try {
        await this.bot.telegram.sendMessage(
          userId,
          '🎉 *KẾT NỐI GOOGLE THÀNH CÔNG!*\n\nTài khoản Google Calendar & Google Tasks của bạn đã được liên kết hoàn tất. Bây giờ bạn có thể bắt đầu sử dụng trợ lý rồi nhé! 🚀',
          { parse_mode: 'Markdown' },
        );
      } catch (tgErr) {
        const sendError = tgErr as Error;
        this.logger.warn(
          `Could not send confirmation message to user ${userId}: ${sendError.message}`,
        );
      }

      // Get bot username for the redirect button
      let botUsername = '';
      try {
        const me = await this.bot.telegram.getMe();
        botUsername = me.username;
      } catch {
        // ignore
      }

      res.status(200).send(renderSuccessHtml(botUsername));
    } catch (err) {
      const exchangeError = err as Error;
      this.logger.error(
        `Failed to exchange code in callback for user ${userId}: ${exchangeError.message}`,
      );
      res.status(500).send(renderErrorHtml(exchangeError.message));
    }
  }
}
