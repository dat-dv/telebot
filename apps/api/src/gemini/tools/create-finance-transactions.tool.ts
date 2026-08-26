import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

export interface CreateFinanceTransactionItemArgs {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  note: string;
  placeId?: string;
  createNewPlace?: boolean;
  placeName?: string;
  occurredAt?: string;
}

export interface CreateFinanceTransactionsArgs {
  transactions: CreateFinanceTransactionItemArgs[];
}

export interface CreatedFinanceTransactionSummary {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  amountText: string;
  category: string;
  note: string;
  placeName?: string;
  occurredAt: string;
}

export interface FailedFinanceTransactionSummary {
  note: string;
  amount?: number;
  error: string;
}

export interface CreateFinanceTransactionsResult extends Record<string, unknown> {
  success: boolean;
  totalAmount: number;
  totalAmountText: string;
  created: CreatedFinanceTransactionSummary[];
  failed: FailedFinanceTransactionSummary[];
  message: string;
}

@Injectable()
export class CreateFinanceTransactionsTool implements GeminiTool {
  public readonly name = 'create_finance_transactions';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Ghi NHIỀU khoản thu hoặc chi vào sổ thu–chi cá nhân cùng lúc (từ 2 khoản trở lên trong một tin nhắn). Ví dụ: "1 ly cà phê 35k và 1 ly nước cam 40k", "sáng ăn phở 45k, chiều đổ xăng 50k, tối mua bánh 20k". Số tiền luôn là số dương VND đầy đủ (35k = 35000).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        transactions: {
          type: SchemaType.ARRAY,
          description: 'Danh sách các khoản thu hoặc chi cần ghi sổ, từ 1 đến 20 mục.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: {
                type: SchemaType.STRING,
                description: 'Loại giao dịch: expense cho khoản chi, income cho khoản thu.',
              },
              amount: {
                type: SchemaType.NUMBER,
                description: 'Số tiền dương theo đơn vị VND đầy đủ, ví dụ 35000.',
              },
              category: {
                type: SchemaType.STRING,
                description: 'Danh mục ngắn, ví dụ Ăn uống, Đi lại, Mua sắm, Lương, Khác.',
              },
              note: {
                type: SchemaType.STRING,
                description: 'Nội dung khoản chi ngắn gọn, ví dụ "Ly cà phê", "Ly nước cam".',
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
                  'Tên quán ăn, cửa hàng, địa điểm nếu có trong câu nói (ví dụ: "quán chay Vườn Lài", "The Coffee House").',
              },
              occurredAt: {
                type: SchemaType.STRING,
                description:
                  'Mốc thời gian phát sinh giao dịch theo định dạng ISO 8601 có múi giờ nếu có.',
              },
            },
            required: ['type', 'amount', 'note'],
          },
        },
      },
      required: ['transactions'],
    },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<CreateFinanceTransactionsResult> {
    if (!context?.userId) {
      return {
        success: false,
        totalAmount: 0,
        totalAmountText: '0đ',
        created: [],
        failed: [],
        message: 'Không xác định được danh tính người dùng Telegram.',
      };
    }

    const payload = args as unknown as CreateFinanceTransactionsArgs;
    if (
      !Array.isArray(payload.transactions) ||
      payload.transactions.length === 0 ||
      payload.transactions.length > 20
    ) {
      return {
        success: false,
        totalAmount: 0,
        totalAmountText: '0đ',
        created: [],
        failed: [],
        message: 'Danh sách giao dịch phải có từ 1 đến 20 mục.',
      };
    }

    const created: CreatedFinanceTransactionSummary[] = [];
    const failed: FailedFinanceTransactionSummary[] = [];
    let totalExpense = 0;

    for (const item of payload.transactions) {
      const note = item?.note?.trim();
      const amount = Number(item?.amount);

      if (!note) {
        failed.push({ note: '(chưa có mô tả)', amount, error: 'Thiếu nội dung giao dịch.' });
        continue;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        failed.push({ note, amount, error: 'Số tiền không hợp lệ hoặc nhỏ hơn hoặc bằng 0.' });
        continue;
      }

      if (item.type !== 'income' && item.type !== 'expense') {
        failed.push({ note, amount, error: 'Loại giao dịch phải là income hoặc expense.' });
        continue;
      }

      try {
        const transaction = await this.financeService.createTransaction({
          userId: context.userId,
          type: item.type,
          amount,
          category: item.category,
          note,
          placeId: item.placeId?.trim() || undefined,
          createNewPlace: item.createNewPlace,
          placeName: item.placeName?.trim() || undefined,
          occurredAt: item.occurredAt,
        });

        created.push({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          amountText: this.financeService.formatMoney(transaction.amount),
          category: transaction.category,
          note: transaction.note,
          placeName: item.placeName,
          occurredAt: transaction.occurredAt.toISOString(),
        });
        totalExpense += transaction.amount;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ note, amount, error: message });
      }
    }

    const success = failed.length === 0 && created.length > 0;
    const totalAmountText = this.financeService.formatMoney(totalExpense);

    return {
      success,
      totalAmount: totalExpense,
      totalAmountText,
      created,
      failed,
      message: success
        ? `Đã ghi sổ ${created.length} giao dịch (Tổng: ${totalAmountText}).`
        : `Đã ghi ${created.length} giao dịch; ${failed.length} giao dịch chưa ghi được.`,
    };
  }
}
