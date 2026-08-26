import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class AllocateTransactionToDebtsTool implements GeminiTool {
  public readonly name = 'allocate_transaction_to_debts';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Gắn/phân bổ số tiền từ một giao dịch thu hoặc chi vào một hoặc nhiều khoản công nợ. Yêu cầu xác nhận từ người dùng.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        transactionId: {
          type: SchemaType.STRING,
          description: 'ID giao dịch thu/chi nguồn.',
        },
        allocations: {
          type: SchemaType.ARRAY,
          description: 'Danh sách các khoản phân bổ công nợ.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              debtId: {
                type: SchemaType.STRING,
                description:
                  'ID khoản nợ cần phân bổ (lấy từ list_candidate_debts hoặc list_debts).',
              },
              amount: {
                type: SchemaType.NUMBER,
                description: 'Số tiền phân bổ (VND dương).',
              },
              note: {
                type: SchemaType.STRING,
                description: 'Ghi chú phân bổ nếu có.',
              },
            },
            required: ['debtId', 'amount'],
          },
        },
      },
      required: ['transactionId', 'allocations'],
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
    const transactionId = args.transactionId as string;
    const rawAllocs = Array.isArray(args.allocations) ? args.allocations : [];
    const allocations = rawAllocs.map((item) => {
      const rec = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        debtId: typeof rec.debtId === 'string' ? rec.debtId : '',
        amount: typeof rec.amount === 'number' ? rec.amount : Number(rec.amount) || 0,
        note: typeof rec.note === 'string' ? rec.note : undefined,
      };
    });

    try {
      const result = await this.financeService.allocateTransactionToDebts(
        context.userId,
        transactionId,
        allocations,
      );
      return {
        success: true,
        allocatedCount: result.allocations.length,
        remainingUnallocated: result.remainingUnallocated,
        remainingUnallocatedText: this.financeService.formatMoney(result.remainingUnallocated),
        allocations: result.allocations.map((a) => ({
          debtId: a.debtId,
          amount: a.amount,
          amountText: this.financeService.formatMoney(a.amount),
          counterparty: a.debt?.counterparty,
          debtRemainingText: a.debt
            ? this.financeService.formatMoney(a.debt.remainingAmount)
            : undefined,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Không thể phân bổ giao dịch vào công nợ.',
      };
    }
  }
}
