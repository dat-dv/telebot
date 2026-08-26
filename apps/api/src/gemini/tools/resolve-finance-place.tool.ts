import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class ResolveFinancePlaceTool implements GeminiTool {
  public readonly name = 'resolve_finance_place';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tra cứu danh sách quán ăn, cửa hàng, địa điểm hoặc đối tác trước khi ghi hoặc sửa khoản thu–chi có gắn địa điểm. Chỉ so khớp chính xác theo tên đã chuẩn hoá; KHÔNG dùng tìm gần đúng hoặc LIKE. Dùng BẮT BUỘC trước create_finance_transaction, create_finance_transactions hoặc update_finance_transaction khi người dùng có nhắc đến tên quán ăn/địa điểm.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: 'Tên quán ăn, cửa hàng hoặc địa điểm cần tra cứu.',
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
    const places = await this.financeService.resolvePlaces(context.userId, args.name as string);
    return {
      success: true,
      count: places.length,
      places: places.map((place) => ({
        placeId: place.id,
        name: place.name,
      })),
    };
  }
}
