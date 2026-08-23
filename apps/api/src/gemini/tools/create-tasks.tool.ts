import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GoogleTasksService } from '../../google/google-tasks.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { CreateTaskArgs } from './create-task.tool';

interface CreateTasksArgs {
  tasks: CreateTaskArgs[];
}

interface CreatedTask {
  id?: string | null;
  title: string;
}

interface FailedTask {
  title: string;
  error: string;
}

export interface CreateTasksResult extends Record<string, unknown> {
  success: boolean;
  created: CreatedTask[];
  failed: FailedTask[];
  message: string;
}

@Injectable()
export class CreateTasksTool implements GeminiTool {
  public readonly name = 'create_tasks';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tạo nhiều công việc cần làm trên Google Tasks trong một lần. Dùng khi người dùng nêu một danh sách/checklist từ hai việc độc lập trở lên.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tasks: {
          type: SchemaType.ARRAY,
          description: 'Danh sách công việc cần tạo, từ 1 đến 20 mục.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING, description: 'Tiêu đề công việc.' },
              notes: { type: SchemaType.STRING, description: 'Ghi chú chi tiết, nếu có.' },
              due: {
                type: SchemaType.STRING,
                description: 'Hạn chót RFC 3339 / ISO 8601, nếu có.',
              },
            },
            required: ['title'],
          },
        },
      },
      required: ['tasks'],
    },
  };

  constructor(private readonly tasksService: GoogleTasksService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<CreateTasksResult> {
    const payload = args as unknown as CreateTasksArgs;
    if (!Array.isArray(payload.tasks) || payload.tasks.length === 0 || payload.tasks.length > 20) {
      return {
        success: false,
        created: [],
        failed: [],
        message: 'Danh sách công việc phải có từ 1 đến 20 mục.',
      };
    }

    const created: CreatedTask[] = [];
    const failed: FailedTask[] = [];

    for (const item of payload.tasks) {
      const title = item?.title?.trim();
      if (!title) {
        failed.push({ title: '(không có tiêu đề)', error: 'Thiếu tiêu đề công việc.' });
        continue;
      }

      try {
        const task = await this.tasksService.createTask(
          { title, notes: item.notes, due: item.due },
          context?.userId,
        );
        created.push({ id: task.id, title });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ title, error: message });
      }
    }

    const success = failed.length === 0;
    return {
      success,
      created,
      failed,
      message: success
        ? `Đã thêm ${created.length} công việc vào Google Tasks.`
        : `Đã thêm ${created.length} công việc; ${failed.length} công việc chưa tạo được.`,
    };
  }
}
