import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class CreateDebtTool implements GeminiTool {
  public readonly name = 'create_debt';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Ghi một khoản công nợ. Dùng khi người dùng cho ai đó mượn tiền (direction receivable: người kia nợ người dùng) hoặc vay/mượn tiền của ai đó (direction payable: người dùng nợ họ). Ví dụ: "cho Nam mượn 2 triệu", "vay Lan 500k". Không dùng cho chi tiêu thông thường.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        direction: {
          type: SchemaType.STRING,
          description:
            'receivable nếu người khác nợ người dùng; payable nếu người dùng nợ người khác.',
        },
        counterparty: { type: SchemaType.STRING, description: 'Tên người liên quan.' },
        counterpartyAlias: {
          type: SchemaType.STRING,
          description: 'Biệt danh để phân biệt người trùng tên, ví dụ Trí Đen. Tùy chọn.',
        },
        contactId: {
          type: SchemaType.STRING,
          description: 'Mã người liên quan lấy từ resolve_debt_contact khi có đúng một kết quả.',
        },
        createNewContact: {
          type: SchemaType.BOOLEAN,
          description:
            'Chỉ true khi resolve_debt_contact không có kết quả và người dùng xác nhận payload tạo người mới.',
        },
        amount: { type: SchemaType.NUMBER, description: 'Số tiền dương theo VND đầy đủ.' },
        note: { type: SchemaType.STRING, description: 'Ghi chú ngắn, tùy chọn.' },
        dueAt: {
          type: SchemaType.STRING,
          description: 'Ngày hẹn trả ISO 8601 nếu người dùng có nói.',
        },
      },
      required: ['direction', 'counterparty', 'amount'],
    },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    if (!context?.userId)
      return { success: false, error: 'Không xác định được danh tính người dùng Telegram.' };
    const direction = args.direction as 'receivable' | 'payable';
    if (direction !== 'receivable' && direction !== 'payable')
      return { success: false, error: 'Loại công nợ không hợp lệ.' };
    try {
      const debt = await this.financeService.createDebt({
        userId: context.userId,
        direction,
        counterparty: args.counterparty as string,
        counterpartyAlias: args.counterpartyAlias as string | undefined,
        contactId: args.contactId as string | undefined,
        createNewContact: args.createNewContact as boolean | undefined,
        amount: args.amount as number,
        note: args.note as string | undefined,
        dueAt: args.dueAt as string | undefined,
      });
      return {
        success: true,
        debt: {
          id: debt.id,
          direction: debt.direction,
          counterparty: debt.counterparty,
          counterpartyAlias: debt.counterpartyAlias,
          remainingText: this.financeService.formatMoney(debt.remainingAmount),
          note: debt.note,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message || 'Không thể lưu công nợ.' };
    }
  }
}
