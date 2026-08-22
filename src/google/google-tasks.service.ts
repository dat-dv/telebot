import { Injectable, Logger } from '@nestjs/common';
import { google, tasks_v1 } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';

export interface CreateTaskOptions {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp (e.g. 2026-08-23T23:59:59.000Z)
  taskListId?: string;
}

export interface ListTasksOptions {
  taskListId?: string;
  showCompleted?: boolean;
  showHidden?: boolean;
  dueMin?: string;
  dueMax?: string;
  maxResults?: number;
}

@Injectable()
export class GoogleTasksService {
  private readonly logger = new Logger(GoogleTasksService.name);

  constructor(private readonly authService: GoogleAuthService) {}

  private getTasksClient(): tasks_v1.Tasks {
    const auth = this.authService.getOAuth2Client();
    if (!auth || !this.authService.isAuthorized()) {
      throw new Error(
        'Google Tasks chưa được xác thực. Hãy đảm bảo bạn đã cung cấp gcp-oauth.keys.json và chạy "npm run auth".',
      );
    }
    return google.tasks({ version: 'v1', auth });
  }

  public async listTaskLists(): Promise<tasks_v1.Schema$TaskList[]> {
    const tasks = this.getTasksClient();
    const res = await tasks.tasklists.list();
    return res.data.items || [];
  }

  public async listTasks(options: ListTasksOptions = {}): Promise<tasks_v1.Schema$Task[]> {
    const tasks = this.getTasksClient();
    const taskListId = options.taskListId || '@default';

    const res = await tasks.tasks.list({
      tasklist: taskListId,
      showCompleted: options.showCompleted ?? false,
      showHidden: options.showHidden ?? false,
      dueMin: options.dueMin,
      dueMax: options.dueMax,
      maxResults: options.maxResults || 50,
    });

    return res.data.items || [];
  }

  public async createTask(options: CreateTaskOptions): Promise<tasks_v1.Schema$Task> {
    const tasks = this.getTasksClient();
    const taskListId = options.taskListId || '@default';

    const res = await tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title: options.title,
        notes: options.notes,
        due: options.due,
        status: 'needsAction',
      },
    });

    this.logger.log(`Created Google Task: "${options.title}" (ID: ${res.data.id})`);
    return res.data;
  }

  public async completeTask(
    taskId: string,
    taskListId: string = '@default',
  ): Promise<tasks_v1.Schema$Task> {
    const tasks = this.getTasksClient();

    const res = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        status: 'completed',
      },
    });

    this.logger.log(`Completed Google Task: ${taskId}`);
    return res.data;
  }

  public async deleteTask(taskId: string, taskListId: string = '@default'): Promise<boolean> {
    const tasks = this.getTasksClient();
    await tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId,
    });
    this.logger.log(`Deleted Google Task: ${taskId}`);
    return true;
  }
}
