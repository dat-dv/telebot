import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

interface GetFinanceSummaryArgs {
  startAt?: string;
  endAt?: string;
}

@Injectable()
export class GetFinanceSummaryTool implements GeminiTool {
  public readonly name = 'get_finance_summary';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xem tổng hợp sổ thu–chi của người dùng theo một khoảng thời gian. Dùng khi người dùng hỏi "hôm nay tiêu bao nhiêu", "tháng này thu chi thế nào", "xem sổ chi tiêu". Nếu họ hỏi hôm nay, truyền từ 00:00:00 đến 23:59:59 của hôm nay theo múi giờ +07:00; nếu không nêu khoảng thời gian, bỏ cả hai để lấy toàn bộ giao dịch.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startAt: {
          type: SchemaType.STRING,
          description: 'Mốc bắt đầu ISO 8601 có múi giờ.',
        },
        endAt: {
          type: SchemaType.STRING,
          description: 'Mốc kết thúc ISO 8601 có múi giờ.',
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

    const payload = args as unknown as GetFinanceSummaryArgs;
    try {
      const summary = await this.financeService.getSummary(
        context.userId,
        payload.startAt,
        payload.endAt,
      );
      return {
        success: true,
        count: summary.transactions.length,
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance,
        incomeText: this.financeService.formatMoney(summary.income),
        expenseText: this.financeService.formatMoney(summary.expense),
        balanceText: this.financeService.formatMoney(summary.balance),
        transactions: summary.transactions.slice(0, 20).map((transaction) => ({
          type: transaction.type,
          amount: transaction.amount,
          amountText: this.financeService.formatMoney(transaction.amount),
          category: transaction.category,
          note: transaction.note,
          occurredAt: transaction.occurredAt.toISOString(),
        })),
      };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message || 'Không thể xem sổ thu–chi.' };
    }
  }
}
