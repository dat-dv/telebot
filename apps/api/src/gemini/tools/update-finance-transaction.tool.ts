import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService, UpdateTransactionDto } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

interface UpdateFinanceTransactionArgs {
  transactionId?: string;
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  note?: string;
  occurredAt?: string;
}

@Injectable()
export class UpdateFinanceTransactionTool implements GeminiTool {
  public readonly name = 'update_finance_transaction';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Cập nhật hoặc chỉnh sửa một khoản thu hoặc chi trong sổ thu–chi cá nhân (ví dụ: sửa đổi/bổ sung giờ phát sinh occurredAt, số tiền amount, danh mục category, hoặc ghi chú note). Dùng khi người dùng nhắn đính chính hoặc bổ sung chi tiết sau khi vừa ghi sổ (như "Mua lúc 9h sáng", "Sửa thành 50k", "Đổi danh mục thành Ăn uống") hoặc yêu cầu sửa một giao dịch cụ thể. Nếu không có transactionId, hệ thống sẽ tự động tìm giao dịch gần nhất vừa tạo của người dùng để cập nhật.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        transactionId: {
          type: SchemaType.STRING,
          description:
            'Mã ID giao dịch cần sửa. Nếu không truyền hoặc để trống, hệ thống sẽ tự động cập nhật giao dịch gần nhất của người dùng.',
        },
        type: {
          type: SchemaType.STRING,
          description: 'Loại giao dịch mới: expense cho khoản chi, income cho khoản thu.',
        },
        amount: {
          type: SchemaType.NUMBER,
          description: 'Số tiền dương mới theo đơn vị VND đầy đủ, ví dụ: 50000.',
        },
        category: {
          type: SchemaType.STRING,
          description: 'Tên danh mục mới, ví dụ Ăn uống, Đi lại, Mua sắm, v.v.',
        },
        note: {
          type: SchemaType.STRING,
          description: 'Nội dung/ghi chú mới của giao dịch.',
        },
        occurredAt: {
          type: SchemaType.STRING,
          description:
            'Mốc thời gian phát sinh mới theo định dạng ISO 8601 có múi giờ (ví dụ: khi người dùng nói "Mua lúc 9h sáng" -> tính theo ngày hôm nay lúc 09:00:00+07:00).',
        },
      },
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

    const payload = args as unknown as UpdateFinanceTransactionArgs;
    const userId = context.userId;

    let targetTransaction = null;
    if (payload.transactionId && payload.transactionId.trim() !== 'recent') {
      targetTransaction = await this.financeService.getTransaction(
        userId,
        payload.transactionId.trim(),
      );
    } else {
      targetTransaction = await this.financeService.getLatestTransaction(userId);
    }

    if (!targetTransaction) {
      return {
        success: false,
        error: 'Không tìm thấy giao dịch thu–chi gần đây để cập nhật.',
      };
    }

    const updateInput: UpdateTransactionDto = {};
    if (payload.type === 'income' || payload.type === 'expense') {
      updateInput.type = payload.type;
    }
    if (typeof payload.amount === 'number' && payload.amount > 0) {
      updateInput.amount = payload.amount;
    }
    if (typeof payload.category === 'string' && payload.category.trim()) {
      updateInput.category = payload.category.trim();
    }
    if (typeof payload.note === 'string' && payload.note.trim()) {
      updateInput.note = payload.note.trim();
    }
    if (typeof payload.occurredAt === 'string' && payload.occurredAt.trim()) {
      updateInput.occurredAt = payload.occurredAt.trim();
    }

    try {
      const updated = await this.financeService.updateTransaction(
        userId,
        targetTransaction.id,
        updateInput,
      );

      if (!updated) {
        return { success: false, error: 'Không thể cập nhật giao dịch.' };
      }

      return {
        success: true,
        updatedFields: Object.keys(updateInput),
        transaction: {
          id: updated.id,
          type: updated.type,
          amount: updated.amount,
          amountText: this.financeService.formatMoney(updated.amount),
          category: updated.category,
          note: updated.note,
          occurredAt: updated.occurredAt.toISOString(),
        },
      };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message || 'Lỗi khi cập nhật giao dịch.' };
    }
  }
}
