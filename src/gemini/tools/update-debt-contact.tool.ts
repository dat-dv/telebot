import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class UpdateDebtContactTool implements GeminiTool {
  public readonly name = 'update_debt_contact';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Đổi tên hoặc biệt danh của một người trong danh bạ công nợ. Phải gọi resolve_debt_contact trước để lấy contactId chính xác.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contactId: {
          type: SchemaType.STRING,
          description: 'Mã người liên quan lấy từ resolve_debt_contact.',
        },
        name: { type: SchemaType.STRING, description: 'Tên mới.' },
        alias: { type: SchemaType.STRING, description: 'Biệt danh mới, bỏ trống nếu không dùng.' },
      },
      required: ['contactId', 'name'],
    },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    if (!context?.userId)
      return { success: false, error: 'Không xác định được danh tính người dùng Telegram.' };
    try {
      const contact = await this.financeService.updateContact(
        context.userId,
        args.contactId as string,
        args.name as string,
        args.alias as string | undefined,
      );
      return {
        success: true,
        contact: { id: contact.id, name: contact.displayName, alias: contact.alias },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Không thể cập nhật người liên quan.',
      };
    }
  }
}
