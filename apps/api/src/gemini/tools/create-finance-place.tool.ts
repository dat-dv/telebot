import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FinanceService } from '../../finance/finance.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class CreateFinancePlaceTool implements GeminiTool {
  public readonly name = 'create_finance_place';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tạo mới một địa điểm, quán ăn hoặc cửa hàng vào danh sách nơi chốn cá nhân. Dùng khi người dùng yêu cầu tạo riêng một nơi chốn/quán ăn mới.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: 'Tên nơi chốn, quán ăn hoặc cửa hàng mới cần tạo.',
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
    const name = args.name as string;
    if (!name?.trim()) {
      return { success: false, error: 'Tên nơi chốn không được để trống.' };
    }
    try {
      const place = await this.financeService.createPlace(context.userId, name.trim());
      return {
        success: true,
        place: {
          id: place.id,
          name: place.name,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message || 'Không thể tạo nơi chốn.' };
    }
  }
}
