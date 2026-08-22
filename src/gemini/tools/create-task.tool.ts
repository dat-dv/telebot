import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool } from './tool.interface';
import { GoogleTasksService } from '../../google/google-tasks.service';

export interface CreateTaskArgs {
  title: string;
  notes?: string;
  due?: string;
}

export interface CreateTaskResult extends Record<string, unknown> {
  success: boolean;
  message?: string;
  task?: {
    id?: string | null;
    title?: string | null;
    notes?: string | null;
    due?: string | null;
    status?: string | null;
  };
  error?: string;
}

@Injectable()
export class CreateTaskTool implements GeminiTool {
  public readonly name = 'create_task';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tạo công việc cần làm mới (To-Do) trên Google Tasks. Dành cho việc cần làm, mua sắm, chuẩn bị tài liệu, bài tập, checklist hoặc công việc có hạn chót (deadline) theo ngày.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description:
            'Tiêu đề công việc cần làm (VD: "Mua sữa và trứng", "Nộp báo cáo tài chính")',
        },
        notes: {
          type: SchemaType.STRING,
          description: 'Ghi chú chi tiết hoặc các bước con của công việc (tùy chọn).',
        },
        due: {
          type: SchemaType.STRING,
          description:
            'Hạn chót hoàn thành (deadline) theo chuẩn RFC 3339 / ISO 8601 (VD: "2026-08-23T23:59:59.000Z"). Tùy chọn.',
        },
      },
      required: ['title'],
    },
  };

  constructor(private readonly tasksService: GoogleTasksService) {}

  public async execute(args: Record<string, unknown>): Promise<CreateTaskResult> {
    try {
      const payload = args as unknown as CreateTaskArgs;
      const task = await this.tasksService.createTask({
        title: payload.title,
        notes: payload.notes,
        due: payload.due,
      });

      return {
        success: true,
        message: `Đã thêm thành công công việc "${task.title}" vào Google Tasks.`,
        task: {
          id: task.id,
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status,
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Không thể tạo công việc Google Tasks',
      };
    }
  }
}
