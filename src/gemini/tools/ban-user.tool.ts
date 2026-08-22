import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { UsersService } from '../../users/users.service';
import { GoogleAuthService } from '../../google/google-auth.service';

@Injectable()
export class BanUserTool implements GeminiTool {
  private readonly logger = new Logger(BanUserTool.name);
  public readonly name = 'ban_user';

  public readonly declaration: FunctionDeclaration = {
    name: 'ban_user',
    description:
      'Khóa tài khoản, thu hồi quyền truy cập bot và xóa toàn bộ dữ liệu token Google của một người dùng. Dùng khi Admin yêu cầu: "Xóa user <id>", "Ban user <id>", "Thu hồi quyền <id>". CHỈ QUẢN TRỊ VIÊN (ADMIN) MỚI CÓ QUYỀN GỌI CÔNG CỤ NÀY.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        targetUserId: {
          type: SchemaType.STRING,
          description:
            'Telegram User ID của người dùng cần khóa/thu hồi quyền (ví dụ: "987654321")',
        },
      },
      required: ['targetUserId'],
    },
  };

  constructor(
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const userId = context?.userId;
    if (!userId) {
      return {
        success: false,
        error: 'Không xác định được danh tính người dùng Telegram.',
      };
    }

    // Strict Admin Authorization Check
    const isAdmin = this.usersService.isAdmin(userId);
    if (!isAdmin) {
      this.logger.warn(`Non-admin user ${userId} attempted to call ban_user tool.`);
      return {
        success: false,
        error:
          '⛔ Quyền truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền khóa người dùng.',
      };
    }

    const rawTargetId = (args.targetUserId as string)?.trim();
    const targetId = Number(rawTargetId);

    if (!targetId || isNaN(targetId)) {
      return {
        success: false,
        error: `Telegram User ID không hợp lệ: "${rawTargetId}"`,
      };
    }

    if (this.usersService.isAdmin(targetId)) {
      return {
        success: false,
        error: '⚠️ Không thể khóa tài khoản của Quản trị viên (Admin).',
      };
    }

    try {
      const banSuccess = await this.usersService.banUser(targetId);
      await this.googleAuthService.revokeUserTokens(targetId);

      this.logger.log(`Admin ${userId} banned user ${targetId} via Gemini Tool`);

      return {
        success: banSuccess,
        targetUserId: targetId,
        message: banSuccess
          ? `Đã khóa vĩnh viễn quyền truy cập và hủy bỏ toàn bộ token Google của User ID ${targetId}.`
          : `Không tìm thấy User ID ${targetId} trong danh sách người dùng.`,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to ban user ${targetId} for admin ${userId}: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi khóa người dùng: ${error.message}`,
      };
    }
  }
}
