import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class RecordDebtPaymentTool implements GeminiTool {
  public readonly name = 'record_debt_payment';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Ghi nhận một khoản trả nợ và giảm số còn lại. Khi người dùng nói "Nam trả anh 200k" hoặc "anh trả Lan 100k", nếu chưa có debtId hãy gọi list_debts trước để tìm đúng khoản nợ.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        debtId: {
          type: SchemaType.STRING,
          description: 'ID khoản nợ cần cập nhật, lấy từ list_debts.',
        },
        amount: { type: SchemaType.NUMBER, description: 'Số tiền trả dương theo VND đầy đủ.' },
      },
      required: ['debtId', 'amount'],
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
      const debt = await this.financeService.recordDebtPayment(
        context.userId,
        args.debtId as string,
        args.amount as number,
      );
      return {
        success: true,
        settled: debt.status === 'settled',
        counterparty: debt.counterparty,
        remainingText: this.financeService.formatMoney(debt.remainingAmount),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Không thể cập nhật khoản trả nợ.',
      };
    }
  }
}
