import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class CreateDebtContactTool implements GeminiTool {
  public readonly name = 'create_debt_contact';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tạo mới một người liên quan vào danh bạ công nợ một cách độc lập mà KHÔNG bắt buộc phải tạo khoản nợ ngay. Dùng khi người dùng yêu cầu tạo riêng hoặc lưu thông tin người liên quan, bạn bè, đối tác (có thể kèm biệt danh, mô tả/địa chỉ, số điện thoại, tài khoản ngân hàng). BẮT BUỘC phải gọi resolve_debt_contact trước để kiểm tra.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description:
            'Tên người liên quan cần tạo. Nếu người dùng dặn giữ nguyên tên (ví dụ: "tên là Đức CMC chứ k tách ra"), hãy truyền đúng "Đức CMC" và không tách biệt danh.',
        },
        alias: {
          type: SchemaType.STRING,
          description: 'Biệt danh nếu người dùng nêu rõ ràng biệt danh riêng.',
        },
        descriptor: {
          type: SchemaType.STRING,
          description:
            'Ghi chú, địa chỉ hoặc mô tả nhận diện (ví dụ: "số 90 Quảng Hiền, Bảy Hiền, Hồ Chí Minh").',
        },
        phoneNumber: {
          type: SchemaType.STRING,
          description: 'Số điện thoại của người liên quan nếu có.',
        },
        bankAccountNumber: {
          type: SchemaType.STRING,
          description: 'Số tài khoản ngân hàng nếu có.',
        },
        bankCode: {
          type: SchemaType.STRING,
          description: 'Mã ngân hàng (ví dụ: VCB, TCB, MB) nếu có.',
        },
        bankName: {
          type: SchemaType.STRING,
          description: 'Tên ngân hàng nếu có.',
        },
      },
      required: ['name'],
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
    const name = typeof args.name === 'string' ? args.name.trim() : '';
    if (!name) {
      return { success: false, error: 'Tên người liên quan không được để trống.' };
    }

    const alias =
      typeof args.alias === 'string' && args.alias.trim() ? args.alias.trim() : undefined;
    const descriptor =
      typeof args.descriptor === 'string' && args.descriptor.trim()
        ? args.descriptor.trim()
        : undefined;
    const phoneNumber =
      typeof args.phoneNumber === 'string' && args.phoneNumber.trim()
        ? args.phoneNumber.trim()
        : undefined;
    const bankAccountNumber =
      typeof args.bankAccountNumber === 'string' && args.bankAccountNumber.trim()
        ? args.bankAccountNumber.trim()
        : undefined;
    const bankCode =
      typeof args.bankCode === 'string' && args.bankCode.trim() ? args.bankCode.trim() : undefined;
    const bankName =
      typeof args.bankName === 'string' && args.bankName.trim() ? args.bankName.trim() : undefined;

    try {
      const contact = await this.financeService.createContact(
        context.userId,
        name,
        alias,
        descriptor,
        phoneNumber,
        bankAccountNumber,
        bankCode,
        bankName,
      );
      return {
        success: true,
        contact: {
          id: contact.id,
          name: contact.displayName,
          alias: contact.alias,
          descriptor: contact.descriptor,
          phoneNumber: contact.phoneNumber,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Không thể tạo người liên quan.',
      };
    }
  }
}
