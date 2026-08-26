import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class ListCandidateDebtsTool implements GeminiTool {
  public readonly name = 'list_candidate_debts';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tra cứu danh sách các khoản công nợ mở (cùng chiều thu/chi và cùng người liên quan nếu có) thích hợp để phân bổ từ một giao dịch thu/chi.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        transactionId: {
          type: SchemaType.STRING,
          description: 'ID giao dịch thu/chi cần tìm khoản công nợ để phân bổ.',
        },
      },
      required: ['transactionId'],
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
    if (!transactionId) {
      return { success: false, error: 'Thiếu transactionId.' };
    }

    try {
      const candidates = await this.financeService.listCandidateDebts(
        context.userId,
        transactionId,
      );
      return {
        success: true,
        count: candidates.length,
        candidates: candidates.map((debt) => ({
          id: debt.id,
          direction: debt.direction,
          counterparty: debt.counterparty,
          counterpartyAlias: debt.counterpartyAlias,
          remainingAmount: debt.remainingAmount,
          remainingText: this.financeService.formatMoney(debt.remainingAmount),
          currentAllocatedAmount: debt.currentAllocatedAmount,
          note: debt.note,
          dueAt: debt.dueAt,
          occurredAt: debt.occurredAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Không thể lấy danh sách công nợ ứng viên.',
      };
    }
  }
}
