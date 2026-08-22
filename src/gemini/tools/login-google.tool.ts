import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { GoogleAuthService } from '../../google/google-auth.service';

@Injectable()
export class LoginGoogleTool implements GeminiTool {
  private readonly logger = new Logger(LoginGoogleTool.name);
  public readonly name = 'login_google';

  public readonly declaration: FunctionDeclaration = {
    name: 'login_google',
    description:
      'Tạo đường link xác thực tài khoản Google OAuth 2.0 (Google Calendar & Google Tasks) cá nhân hóa cho người dùng và hướng dẫn cách hoàn tất kết nối.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reason: {
          type: SchemaType.STRING,
          description: 'Lý do người dùng muốn đăng nhập (tùy chọn)',
        },
      },
    },
  };

  constructor(private readonly googleAuthService: GoogleAuthService) {}

  public execute(
    _args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const userId = context?.userId;
    if (!userId) {
      return Promise.resolve({
        success: false,
        error: 'Không xác định được danh tính người dùng Telegram.',
      });
    }

    try {
      const authUrl = this.googleAuthService.generateAuthUrl(userId);
      const isAlreadyConnected = this.googleAuthService.isAuthorized(userId);

      this.logger.log(`Generated Google OAuth login link for user ${userId}`);

      return Promise.resolve({
        success: true,
        authUrl,
        isAlreadyConnected,
        instruction:
          '1. Nhấn vào link đăng nhập Google ở trên.\n2. Chọn tài khoản Gmail của bạn và nhấn Cho phép (Allow).\n3. Copy mã xác thực (Authorization Code) hiện ra và gửi lại cho bot bằng cú pháp: /code <mã_xác_thực>',
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to generate login link for user ${userId}: ${error.message}`);
      return Promise.resolve({
        success: false,
        error: `Không thể tạo link đăng nhập: ${error.message}`,
      });
    }
  }
}
