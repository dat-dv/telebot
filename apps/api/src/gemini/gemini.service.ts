import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, ChatSession, Content } from '@google/generative-ai';
import { GeminiTool } from './tools/tool.interface';
import { CreateCalendarTool } from './tools/create-calendar.tool';
import { ListCalendarTool } from './tools/list-calendar.tool';
import { DeleteCalendarTool } from './tools/delete-calendar.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { CreateTasksTool } from './tools/create-tasks.tool';
import { ListTasksTool } from './tools/list-tasks.tool';
import { CompleteTaskTool } from './tools/complete-task.tool';
import { LoginGoogleTool } from './tools/login-google.tool';
import { InviteUserTool } from './tools/invite-user.tool';
import { ListUsersTool } from './tools/list-users.tool';
import { BanUserTool } from './tools/ban-user.tool';
import { CreateReminderTool } from './tools/create-reminder.tool';
import { ListRemindersTool } from './tools/list-reminders.tool';
import { DeleteReminderTool } from './tools/delete-reminder.tool';
import { CreateFinanceTransactionTool } from './tools/create-finance-transaction.tool';
import { GetFinanceSummaryTool } from './tools/get-finance-summary.tool';
import { CreateDebtTool } from './tools/create-debt.tool';
import { ListDebtsTool } from './tools/list-debts.tool';
import { RecordDebtPaymentTool } from './tools/record-debt-payment.tool';
import { ResolveDebtContactTool } from './tools/resolve-debt-contact.tool';
import { UpdateDebtContactTool } from './tools/update-debt-contact.tool';
import { UpdateReminderTool } from './tools/update-reminder.tool';
import { buildSystemInstruction, getCurrentTimeInfo } from './helpers/gemini-prompt.helper';
import { randomUUID } from 'crypto';

export interface ChatResponse {
  text: string;
  lastTool?: {
    name: string;
    result: Record<string, unknown>;
  };
  pendingAction?: {
    id: string;
    referenceId: string;
    name: string;
    payload: Record<string, unknown>;
  };
}

interface PendingToolAction {
  referenceId: string;
  userId: number;
  botUsername?: string;
  name: string;
  payload: Record<string, unknown>;
  expiresAt: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private toolsMap: Map<string, GeminiTool> = new Map();
  private readonly defaultTimeZone: string;
  private primaryModelName: string;
  private readonly pendingActions = new Map<string, PendingToolAction>();
  private readonly confirmationRequiredTools = new Set([
    'create_calendar_event',
    'delete_calendar_event',
    'create_task',
    'create_tasks',
    'complete_task',
    'create_invite_link',
    'ban_user',
    'create_reminder',
    'delete_reminder',
    'create_finance_transaction',
    'create_debt',
    'record_debt_payment',
    'update_debt_contact',
    'update_reminder',
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly createCalendarTool: CreateCalendarTool,
    private readonly listCalendarTool: ListCalendarTool,
    private readonly deleteCalendarTool: DeleteCalendarTool,
    private readonly createTaskTool: CreateTaskTool,
    private readonly createTasksTool: CreateTasksTool,
    private readonly listTasksTool: ListTasksTool,
    private readonly completeTaskTool: CompleteTaskTool,
    private readonly loginGoogleTool: LoginGoogleTool,
    private readonly inviteUserTool: InviteUserTool,
    private readonly listUsersTool: ListUsersTool,
    private readonly banUserTool: BanUserTool,
    private readonly createReminderTool: CreateReminderTool,
    private readonly listRemindersTool: ListRemindersTool,
    private readonly deleteReminderTool: DeleteReminderTool,
    private readonly createFinanceTransactionTool: CreateFinanceTransactionTool,
    private readonly getFinanceSummaryTool: GetFinanceSummaryTool,
    private readonly createDebtTool: CreateDebtTool,
    private readonly listDebtsTool: ListDebtsTool,
    private readonly recordDebtPaymentTool: RecordDebtPaymentTool,
    private readonly resolveDebtContactTool: ResolveDebtContactTool,
    private readonly updateDebtContactTool: UpdateDebtContactTool,
    private readonly updateReminderTool: UpdateReminderTool,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey', '');
    const rawModel = this.configService.get<string>('gemini.model', 'gemini-3.5-flash-lite');
    this.primaryModelName =
      !rawModel || rawModel === 'gemini-2.0-flash' || rawModel === 'gemini-1.5-flash'
        ? 'gemini-3.5-flash-lite'
        : rawModel;
    this.defaultTimeZone = this.configService.get<string>('timezone', 'Asia/Ho_Chi_Minh');

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Register all assistant tools.
    const tools: GeminiTool[] = [
      this.createCalendarTool,
      this.listCalendarTool,
      this.deleteCalendarTool,
      this.createTaskTool,
      this.createTasksTool,
      this.listTasksTool,
      this.completeTaskTool,
      this.loginGoogleTool,
      this.inviteUserTool,
      this.listUsersTool,
      this.banUserTool,
      this.createReminderTool,
      this.listRemindersTool,
      this.deleteReminderTool,
      this.createFinanceTransactionTool,
      this.getFinanceSummaryTool,
      this.createDebtTool,
      this.listDebtsTool,
      this.recordDebtPaymentTool,
      this.resolveDebtContactTool,
      this.updateDebtContactTool,
      this.updateReminderTool,
    ];

    for (const tool of tools) {
      this.toolsMap.set(tool.name, tool);
    }
  }

  public getCurrentTimeInfo(): { nowText: string; nowIso: string } {
    return getCurrentTimeInfo(this.defaultTimeZone);
  }

  public async confirmPendingAction(
    actionId: string,
    userId: number,
  ): Promise<{ referenceId: string; name: string; result: Record<string, unknown> }> {
    const pending = this.pendingActions.get(actionId);
    if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
      this.pendingActions.delete(actionId);
      throw new Error('Yêu cầu xác nhận không còn hiệu lực. Hãy gửi lại yêu cầu.');
    }
    this.pendingActions.delete(actionId);
    const tool = this.toolsMap.get(pending.name);
    if (!tool) throw new Error('Không tìm thấy thao tác cần thực hiện.');
    const result = await tool.execute(pending.payload, {
      userId,
      botUsername: pending.botUsername,
    });
    return { referenceId: pending.referenceId, name: pending.name, result };
  }

  public cancelPendingAction(actionId: string, userId: number): boolean {
    const pending = this.pendingActions.get(actionId);
    if (!pending || pending.userId !== userId) return false;
    this.pendingActions.delete(actionId);
    return true;
  }

  public queueToolConfirmation(
    name: string,
    payload: Record<string, unknown>,
    userId: number,
    botUsername?: string,
  ): { id: string; referenceId: string; name: string; payload: Record<string, unknown> } {
    if (!this.confirmationRequiredTools.has(name) || !this.toolsMap.has(name)) {
      throw new Error(`Thao tác ${name} không được phép đưa vào hàng chờ xác nhận.`);
    }
    const id = randomUUID();
    const referenceId = `REQ-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    this.pendingActions.set(id, {
      referenceId,
      userId,
      botUsername,
      name,
      payload,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return { id, referenceId, name, payload };
  }

  private getGenerativeModel(modelName: string): GenerativeModel {
    const systemInstruction = buildSystemInstruction(this.defaultTimeZone);
    const functionDeclarations = Array.from(this.toolsMap.values()).map((t) => t.declaration);

    return this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: [{ functionDeclarations }],
    });
  }

  public async chat(
    userMessage: string,
    chatHistory: Content[] = [],
    userId?: number,
    botUsername?: string,
  ): Promise<ChatResponse> {
    const candidateModels = [
      this.primaryModelName,
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
    ];

    // Remove duplicates while keeping order
    const uniqueModels = Array.from(new Set(candidateModels));

    let lastError: Error | null = null;

    for (const modelName of uniqueModels) {
      try {
        const model = this.getGenerativeModel(modelName);
        const chatSession: ChatSession = model.startChat({
          history: chatHistory,
        });

        let response = await chatSession.sendMessage(userMessage);
        let functionCalls = response.response.functionCalls();
        let lastTool: { name: string; result: Record<string, unknown> } | undefined;

        // Multi-turn loop to execute function calls sequentially
        while (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          this.logger.log(`Gemini invoked tool: ${call.name} (args: ${JSON.stringify(call.args)})`);

          const tool = this.toolsMap.get(call.name);
          let functionResponse: Record<string, unknown>;

          if (!tool) {
            functionResponse = {
              error: `Tool "${call.name}" is not registered in system.`,
            };
          } else if (this.confirmationRequiredTools.has(call.name)) {
            if (!userId) {
              return { text: 'Không xác định được danh tính người dùng để xác nhận thao tác.' };
            }
            const payload = call.args as Record<string, unknown>;
            const pendingAction = this.queueToolConfirmation(
              call.name,
              payload,
              userId,
              botUsername,
            );
            return {
              text: `Tôi đã chuẩn bị payload cho thao tác ${call.name}. Hãy kiểm tra và xác nhận trước khi thực hiện.`,
              pendingAction,
            };
          } else {
            try {
              functionResponse = await tool.execute(call.args as Record<string, unknown>, {
                userId,
                botUsername,
              });
            } catch (toolExecError) {
              const err = toolExecError as Error;
              this.logger.error(`Error executing tool ${call.name}: ${err.message}`);
              functionResponse = {
                error: `Error executing tool: ${err.message}`,
              };
            }
          }

          lastTool = { name: call.name, result: functionResponse };

          // Send tool execution continuation to model
          try {
            response = await chatSession.sendMessage(
              `[Kết quả thực thi công cụ ${call.name}]: ${JSON.stringify(functionResponse)}. Hãy gửi phản hồi tự nhiên, đầy đủ cho người dùng theo đúng thẻ xác nhận.`,
            );
            functionCalls = response.response.functionCalls();
          } catch (contErr) {
            const err = contErr as Error;
            this.logger.warn(
              `Tool continuation chat message failed: ${err.message}. Using direct tool message.`,
            );
            // Fallback directly to tool message or formatted error
            const directMsg =
              (functionResponse.message as string) ||
              (functionResponse.error as string) ||
              JSON.stringify(functionResponse);
            return { text: directMsg, lastTool };
          }
        }

        const replyText = response.response.text();
        return {
          text: replyText || 'Tôi đã xử lý yêu cầu của bạn.',
          lastTool,
        };
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(
          `Model ${modelName} failed: ${lastError.message}. Trying next candidate...`,
        );
      }
    }

    this.logger.error(`All model candidates failed. Last error: ${lastError?.message}`);
    return {
      text: 'Xin lỗi, hệ thống AI hiện đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại sau vài giây.',
    };
  }

  public async getTodaySummary(userId?: number, botUsername?: string): Promise<string> {
    const prompt =
      'Hãy tổng hợp toàn bộ các sự kiện trên Google Calendar và các công việc trên Google Tasks cần làm trong ngày HÔM NAY. Trình bày ngắn gọn, đẹp mắt, chia rõ ràng 2 phần: 📅 Lịch Hẹn & 📝 Việc Cần Làm.';
    const res = await this.chat(prompt, [], userId, botUsername);
    return res.text;
  }

  public async getWeekSummary(userId?: number, botUsername?: string): Promise<string> {
    const prompt =
      'Hãy tổng hợp toàn bộ các sự kiện trên Google Calendar và các công việc trên Google Tasks trong 7 ngày tới (kể từ hôm nay). Trình bày theo từng ngày rõ ràng, chuyên nghiệp.';
    const res = await this.chat(prompt, [], userId, botUsername);
    return res.text;
  }
}
