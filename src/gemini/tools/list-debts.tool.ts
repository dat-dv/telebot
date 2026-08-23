import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class ListDebtsTool implements GeminiTool {
  public readonly name = 'list_debts';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xem các khoản công nợ chưa tất toán. Dùng khi người dùng hỏi ai đang nợ mình, mình đang nợ ai, hoặc xem công nợ.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    _args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    if (!context?.userId)
      return { success: false, error: 'Không xác định được danh tính người dùng Telegram.' };
    const debts = await this.financeService.getActiveDebts(context.userId);
    const receivable = debts
      .filter((debt) => debt.direction === 'receivable')
      .reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const payable = debts
      .filter((debt) => debt.direction === 'payable')
      .reduce((sum, debt) => sum + debt.remainingAmount, 0);
    return {
      success: true,
      receivableText: this.financeService.formatMoney(receivable),
      payableText: this.financeService.formatMoney(payable),
      debts: debts.map((debt) => ({
        id: debt.id,
        direction: debt.direction,
        contactId: debt.contactId,
        counterparty: debt.contact?.displayName || debt.counterparty,
        counterpartyAlias: debt.contact?.alias || debt.counterpartyAlias,
        remainingText: this.financeService.formatMoney(debt.remainingAmount),
        note: debt.note,
        dueAt: debt.dueAt?.toISOString(),
      })),
    };
  }
}
