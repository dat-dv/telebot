import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

interface CreateFinanceTransactionArgs {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  note: string;
  occurredAt?: string;
}

@Injectable()
export class CreateFinanceTransactionTool implements GeminiTool {
  public readonly name = 'create_finance_transaction';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Ghi một khoản thu hoặc chi vào sổ thu–chi cá nhân. Dùng khi người dùng nói đã chi/tiêu/mua/trả tiền, hoặc nhận lương/được trả tiền/hoàn tiền. Ví dụ: "ăn trưa 65k", "hôm nay mua cà phê 30 nghìn", "nhận lương 20 triệu". Số tiền luôn truyền theo VND đầy đủ: 65k = 65000, 20 triệu = 20000000. Nếu người dùng không nêu ngày, bỏ occurredAt để hệ thống dùng thời điểm hiện tại.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: 'Loại giao dịch: expense cho khoản chi, income cho khoản thu.',
        },
        amount: {
          type: SchemaType.NUMBER,
          description: 'Số tiền dương theo đơn vị VND đầy đủ, ví dụ 65000.',
        },
        category: {
          type: SchemaType.STRING,
          description: 'Danh mục ngắn, ví dụ Ăn uống, Đi lại, Mua sắm, Lương, Khác.',
        },
        note: {
          type: SchemaType.STRING,
          description: 'Nội dung giao dịch ngắn gọn, ví dụ "Cơm trưa".',
        },
        occurredAt: {
          type: SchemaType.STRING,
          description:
            'Ngày phát sinh theo ISO 8601 có múi giờ, chỉ truyền khi người dùng nêu ngày cụ thể.',
        },
      },
      required: ['type', 'amount', 'note'],
    },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    if (!context?.userId) {
      return { success: false, error: 'Không xác định được danh tính người dùng Telegram.' };
    }

    const payload = args as unknown as CreateFinanceTransactionArgs;
    if (payload.type !== 'income' && payload.type !== 'expense') {
      return { success: false, error: 'Loại giao dịch phải là khoản thu hoặc khoản chi.' };
    }

    try {
      const transaction = await this.financeService.createTransaction({
        ...payload,
        userId: context.userId,
      });
      return {
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          amountText: this.financeService.formatMoney(transaction.amount),
          category: transaction.category,
          note: transaction.note,
          occurredAt: transaction.occurredAt.toISOString(),
        },
      };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message || 'Không thể lưu giao dịch.' };
    }
  }
}
