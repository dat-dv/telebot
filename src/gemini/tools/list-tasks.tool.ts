import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { GoogleTasksService } from '../../google/google-tasks.service';

export interface ListTasksArgs {
  showCompleted?: boolean;
  dueMin?: string;
  dueMax?: string;
}

export interface TaskItem {
  id?: string | null;
  title?: string | null;
  notes?: string | null;
  due?: string | null;
  status?: string | null;
  updated?: string | null;
}

export interface ListTasksResult extends Record<string, unknown> {
  success: boolean;
  count?: number;
  tasks?: TaskItem[];
  error?: string;
}

@Injectable()
export class ListTasksTool implements GeminiTool {
  public readonly name = 'list_tasks';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xem danh sách công việc cần làm (To-Do list) trên Google Tasks. Mặc định chỉ lấy các công việc chưa hoàn thành.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        showCompleted: {
          type: SchemaType.BOOLEAN,
          description:
            'Có bao gồm các công việc đã hoàn thành hay không (mặc định là false - chỉ xem việc đang chờ làm).',
        },
        dueMin: {
          type: SchemaType.STRING,
          description: 'Hạn chót từ thời điểm nào (RFC 3339). Tùy chọn.',
        },
        dueMax: {
          type: SchemaType.STRING,
          description: 'Hạn chót đến thời điểm nào (RFC 3339). Tùy chọn.',
        },
      },
    },
  };

  constructor(private readonly tasksService: GoogleTasksService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<ListTasksResult> {
    try {
      const payload = args as unknown as ListTasksArgs;
      const items = await this.tasksService.listTasks(
        {
          showCompleted: payload.showCompleted ?? false,
          dueMin: payload.dueMin,
          dueMax: payload.dueMax,
        },
        context?.userId,
      );

      const tasks: TaskItem[] = items.map((item) => ({
        id: item.id,
        title: item.title,
        notes: item.notes,
        due: item.due,
        status: item.status,
        updated: item.updated,
      }));

      return {
        success: true,
        count: tasks.length,
        tasks,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Không thể lấy danh sách Google Tasks',
      };
    }
  }
}
