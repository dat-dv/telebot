import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { UsersService } from '../../users/users.service';
import { GoogleAuthService } from '../../google/google-auth.service';

@Injectable()
export class ListUsersTool implements GeminiTool {
  private readonly logger = new Logger(ListUsersTool.name);
  public readonly name = 'list_users';

  public readonly declaration: FunctionDeclaration = {
    name: 'list_users',
    description:
      'Tra cứu danh sách toàn bộ người dùng/thành viên trong hệ thống, vai trò (Admin/Member) và trạng thái kết nối Google. Dùng khi người dùng (Admin) hỏi: "Xem danh sách thành viên", "Có bao nhiêu người dùng?", "Danh sách user", "Ai đang dùng bot?". CHỈ QUẢN TRỊ VIÊN (ADMIN) MỚI CÓ QUYỀN GỌI CÔNG CỤ NÀY.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filter: {
          type: SchemaType.STRING,
          description: 'Lọc theo vai trò: "all", "admin", "member" (mặc định là "all")',
        },
      },
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
      this.logger.warn(`Non-admin user ${userId} attempted to call list_users tool.`);
      return {
        success: false,
        error:
          '⛔ Quyền truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền xem danh sách thành viên.',
      };
    }

    try {
      const filter = (args.filter as string)?.toLowerCase() || 'all';
      const allUsers = await this.usersService.getUsers();

      const userDetails = allUsers
        .map((u) => {
          const numId = Number(u.id);
          const isGoogleAuth = this.googleAuthService.isAuthorized(numId);
          return {
            id: u.id,
            name: u.firstName || u.username || 'User',
            username: u.username ? `@${u.username}` : 'Không có',
            role: u.role === 'admin' ? '👑 Quản trị viên' : '👤 Thành viên',
            googleConnected: isGoogleAuth ? '✅ Đã kết nối' : '❌ Chưa kết nối',
            createdAt: u.createdAt,
          };
        })
        .filter((u) => {
          if (filter === 'admin') return u.role.includes('Quản trị viên');
          if (filter === 'member') return u.role.includes('Thành viên');
          return true;
        });

      return {
        success: true,
        totalCount: userDetails.length,
        users: userDetails,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to list users for admin ${userId}: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi lấy danh sách người dùng: ${error.message}`,
      };
    }
  }
}
