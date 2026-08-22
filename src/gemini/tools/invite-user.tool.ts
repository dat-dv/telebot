import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class InviteUserTool implements GeminiTool {
  private readonly logger = new Logger(InviteUserTool.name);
  public readonly name = 'create_invite_link';

  public readonly declaration: FunctionDeclaration = {
    name: 'create_invite_link',
    description:
      'Tạo đường link mời 1 lần (hạn 24 giờ) để mời bạn bè hoặc người thân sử dụng bot. CHỈ QUẢN TRỊ VIÊN (ADMIN) MỚI CÓ QUYỀN GỌI CÔNG CỤ NÀY.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        note: {
          type: SchemaType.STRING,
          description: 'Ghi chú về người được mời (tùy chọn)',
        },
      },
    },
  };

  constructor(private readonly usersService: UsersService) {}

  public async execute(
    _args: Record<string, unknown>,
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
      this.logger.warn(`Non-admin user ${userId} attempted to call create_invite_link tool.`);
      return {
        success: false,
        error:
          '⛔ Quyền truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền tạo đường link mời người dùng mới.',
      };
    }

    try {
      const invite = await this.usersService.createInvite(userId);
      this.logger.log(`Admin ${userId} generated invite code ${invite.code} via Gemini Tool`);

      return {
        success: true,
        inviteCode: invite.code,
        expiresAt: invite.expiresAt,
        instruction:
          'Đã tạo mã mời thành công. Hãy gửi đường link định dạng: https://t.me/<bot_username>?start=' +
          invite.code +
          ' cho bạn bè. Link có hiệu lực trong 24 giờ và dùng được 1 lần.',
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to create invite link for admin ${userId}: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi tạo link mời: ${error.message}`,
      };
    }
  }
}
