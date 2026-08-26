import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

interface CreateFinanceTransactionArgs {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  note: string;
  placeId?: string;
  createNewPlace?: boolean;
  placeName?: string;
  occurredAt?: string;
}

@Injectable()
export class CreateFinanceTransactionTool implements GeminiTool {
  public readonly name = 'create_finance_transaction';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Ghi một khoản thu hoặc chi vào sổ thu–chi cá nhân. Dùng khi người dùng nói đã chi/tiêu/mua/trả tiền, hoặc nhận lương/được trả tiền/hoàn tiền cho ĐÚNG MỘT khoản. Nếu có từ 2 khoản độc lập trở lên (vd: "1 cafe 35k và 1 nước cam 40k"), PHẢI gọi create_finance_transactions. Số tiền luôn truyền theo VND đầy đủ: 65k = 65000, 20 triệu = 20000000. Mặc định occurredAt là thời điểm hiện tại nếu người dùng không nêu ngày; nếu người dùng nhập muộn hoặc nêu ngày cụ thể trong quá khứ, truyền occurredAt tương ứng theo ISO 8601 có múi giờ.',
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
          description: 'Nội dung giao dịch ngắn gọn, ví dụ "Cơm trưa", "Ly cà phê".',
        },
        placeId: {
          type: SchemaType.STRING,
          description: 'Mã nơi chốn lấy từ resolve_finance_place khi có đúng một kết quả.',
        },
        createNewPlace: {
          type: SchemaType.BOOLEAN,
          description:
            'Chỉ true khi resolve_finance_place không có kết quả và người dùng muốn tạo nơi chốn mới.',
        },
        placeName: {
          type: SchemaType.STRING,
          description:
            'Tên quán ăn, cửa hàng, địa điểm hoặc đối tác liên quan nếu có trong câu nói (ví dụ: "quán chay Vườn Lài", "Highlands Coffee").',
        },
        occurredAt: {
          type: SchemaType.STRING,
          description:
            'Mốc thời gian phát sinh/phát hành giao dịch theo định dạng ISO 8601 có múi giờ. Mặc định là thời điểm hiện tại nếu không nêu rõ, hoặc mốc quá khứ nếu người dùng nhập muộn.',
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
          placeId: transaction.placeId,
          placeName: payload.placeName?.trim() || undefined,
          occurredAt: transaction.occurredAt.toISOString(),
        },
      };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message || 'Không thể lưu giao dịch.' };
    }
  }
}
