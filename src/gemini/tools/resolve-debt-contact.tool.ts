import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class ResolveDebtContactTool implements GeminiTool {
  public readonly name = 'resolve_debt_contact';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tra cứu danh bạ công nợ trước khi tạo khoản nợ. Chỉ so khớp chính xác theo tên đã chuẩn hoá và, nếu có, biệt danh đã chuẩn hoá; KHÔNG dùng tìm gần đúng hoặc LIKE. Dùng bắt buộc trước create_debt.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'Tên người cần tra cứu.' },
        alias: { type: SchemaType.STRING, description: 'Biệt danh nếu người dùng nêu.' },
      },
      required: ['name'],
    },
  };

  constructor(private readonly financeService: FinanceService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    if (!context?.userId)
      return { success: false, error: 'Không xác định được danh tính người dùng Telegram.' };
    const contacts = await this.financeService.resolveContacts(
      context.userId,
      args.name as string,
      args.alias as string | undefined,
    );
    return {
      success: true,
      count: contacts.length,
      contacts: contacts.map((contact) => ({
        contactId: contact.id,
        name: contact.displayName,
        alias: contact.alias,
        descriptor: contact.descriptor,
      })),
    };
  }
}
