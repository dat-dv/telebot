import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool } from './tool.interface';
import { GoogleTasksService } from '../../google/google-tasks.service';

export interface CompleteTaskArgs {
  taskId: string;
}

export interface CompleteTaskResult extends Record<string, unknown> {
  success: boolean;
  message?: string;
  task?: {
    id?: string | null;
    title?: string | null;
    status?: string | null;
  };
  error?: string;
}

@Injectable()
export class CompleteTaskTool implements GeminiTool {
  public readonly name = 'complete_task';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Đánh dấu hoàn thành một công việc trên Google Tasks bằng taskId. Nếu chưa có taskId, hãy gọi list_tasks trước để tìm đúng taskId.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: 'Mã định danh duy nhất (ID) của công việc trên Google Tasks cần hoàn thành.',
        },
      },
      required: ['taskId'],
    },
  };

  constructor(private readonly tasksService: GoogleTasksService) {}

  public async execute(args: Record<string, unknown>): Promise<CompleteTaskResult> {
    try {
      const payload = args as unknown as CompleteTaskArgs;
      const task = await this.tasksService.completeTask(payload.taskId);
      return {
        success: true,
        message: `Đã đánh dấu hoàn thành công việc "${task.title}" (ID: ${payload.taskId}).`,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
        },
      };
    } catch (error) {
      const err = error as Error;
      const taskIdStr = typeof args['taskId'] === 'string' ? args['taskId'] : '';
      return {
        success: false,
        error: err.message || `Không thể hoàn thành công việc có ID: ${taskIdStr}`,
      };
    }
  }
}
