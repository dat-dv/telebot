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
import { CreateFinanceTransactionsTool } from './tools/create-finance-transactions.tool';
import { UpdateFinanceTransactionTool } from './tools/update-finance-transaction.tool';
import { GetFinanceSummaryTool } from './tools/get-finance-summary.tool';
import { CreateDebtTool } from './tools/create-debt.tool';
import { ListDebtsTool } from './tools/list-debts.tool';
import { RecordDebtPaymentTool } from './tools/record-debt-payment.tool';
import { ResolveDebtContactTool } from './tools/resolve-debt-contact.tool';
import { UpdateDebtContactTool } from './tools/update-debt-contact.tool';
import { ResolveFinancePlaceTool } from './tools/resolve-finance-place.tool';
import { CreateFinancePlaceTool } from './tools/create-finance-place.tool';
import { UpdateReminderTool } from './tools/update-reminder.tool';
import { buildSystemInstruction, getCurrentTimeInfo } from './helpers/gemini-prompt.helper';
import { randomUUID } from 'crypto';
import { GoogleTasksService } from '../google/google-tasks.service';

export interface ReceiptImageAnalysis {
  kind: 'ready' | 'missing_fields' | 'not_receipt';
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  note?: string;
  occurredAt?: string;
  missingFields?: string[];
  summary: string;
}

export function buildReceiptAnalysisPrompt(
  ocrText: string,
  timeInfo: { nowText: string; nowIso: string },
): string {
  return `Phân tích text OCR do Tesseract trích xuất từ ảnh. Chỉ trả JSON hợp lệ, không Markdown và không gọi tool.
=== NGỮ CẢNH THỜI GIAN ===
${timeInfo.nowText}
Mốc ISO-8601 hiện tại theo giờ Việt Nam là ${timeInfo.nowIso}. Chỉ dùng mốc này để diễn giải ngày tương đối được đọc chắc chắn trong OCR; không suy đoán ngày khi ảnh không thể hiện rõ.

Nếu text là hoá đơn, bill hoặc ảnh chụp giao dịch với đủ dữ liệu, trả:
{"kind":"ready","type":"income"|"expense","amount":số_VND_dương,"category":"...","note":"...","occurredAt":"ISO-8601 nếu đọc chắc chắn","summary":"..."}
Nếu là giao dịch nhưng thiếu loại hoặc số tiền, trả:
{"kind":"missing_fields","missingFields":["type"|"amount"],"summary":"..."}
Nếu text không phải giao dịch/hoá đơn, trả:
{"kind":"not_receipt","summary":"..."}
Không suy đoán số tiền, loại giao dịch hoặc ngày. amount luôn là VND đầy đủ.

TEXT OCR:
${ocrText}`;
}

export function parseReceiptImageAnalysis(raw: string): ReceiptImageAnalysis {
  const json = raw.trim().replace(/^```json\s*|\s*```$/g, '');
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { kind: 'not_receipt', summary: 'Không đọc được thông tin giao dịch rõ ràng từ ảnh.' };
  }
  if (!value || typeof value !== 'object') {
    return { kind: 'not_receipt', summary: 'Không đọc được thông tin giao dịch rõ ràng từ ảnh.' };
  }
  const candidate = value as Record<string, unknown>;
  const summary = typeof candidate.summary === 'string' ? candidate.summary.trim() : '';
  const missingFields = Array.isArray(candidate.missingFields)
    ? candidate.missingFields.filter((field): field is string => typeof field === 'string')
    : [];
  const type =
    candidate.type === 'income' || candidate.type === 'expense' ? candidate.type : undefined;
  const amount =
    typeof candidate.amount === 'number' && candidate.amount > 0 ? candidate.amount : undefined;
  const note = typeof candidate.note === 'string' ? candidate.note.trim() : '';

  if (candidate.kind === 'ready' && type && amount && note) {
    return {
      kind: 'ready',
      type,
      amount,
      note,
      category: typeof candidate.category === 'string' ? candidate.category.trim() : undefined,
      occurredAt:
        typeof candidate.occurredAt === 'string' ? candidate.occurredAt.trim() : undefined,
      summary: summary || 'Đã đọc được một giao dịch từ ảnh.',
    };
  }
  if (candidate.kind === 'missing_fields') {
    return {
      kind: 'missing_fields',
      missingFields,
      summary: summary || 'Ảnh chưa đủ thông tin để ghi thu-chi.',
    };
  }
  return { kind: 'not_receipt', summary: summary || 'Ảnh không có giao dịch để ghi thu-chi.' };
}

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
  chatId?: number | string;
  messageId?: number;
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
    'create_finance_transactions',
    'update_finance_transaction',
    'create_finance_place',
    'create_debt',
    'record_debt_payment',
    'update_debt_contact',
    'update_reminder',
  ]);

  private readonly taskCreationTools = new Set(['create_task', 'create_tasks']);

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
    private readonly createFinanceTransactionsTool: CreateFinanceTransactionsTool,
    private readonly updateFinanceTransactionTool: UpdateFinanceTransactionTool,
    private readonly getFinanceSummaryTool: GetFinanceSummaryTool,
    private readonly createDebtTool: CreateDebtTool,
    private readonly listDebtsTool: ListDebtsTool,
    private readonly recordDebtPaymentTool: RecordDebtPaymentTool,
    private readonly resolveDebtContactTool: ResolveDebtContactTool,
    private readonly updateDebtContactTool: UpdateDebtContactTool,
    private readonly resolveFinancePlaceTool: ResolveFinancePlaceTool,
    private readonly createFinancePlaceTool: CreateFinancePlaceTool,
    private readonly updateReminderTool: UpdateReminderTool,
    private readonly tasksService: GoogleTasksService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('gemini.apiKey');
    this.primaryModelName = this.configService.getOrThrow<string>('gemini.model');
    this.defaultTimeZone = this.configService.getOrThrow<string>('timezone');

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
      this.createFinanceTransactionsTool,
      this.updateFinanceTransactionTool,
      this.getFinanceSummaryTool,
      this.createDebtTool,
      this.listDebtsTool,
      this.recordDebtPaymentTool,
      this.resolveDebtContactTool,
      this.updateDebtContactTool,
      this.resolveFinancePlaceTool,
      this.createFinancePlaceTool,
      this.updateReminderTool,
    ];

    for (const tool of tools) {
      this.toolsMap.set(tool.name, tool);
    }
  }

  public getCurrentTimeInfo(): { nowText: string; nowIso: string } {
    return getCurrentTimeInfo(this.defaultTimeZone);
  }

  public async analyzeReceiptText(ocrText: string): Promise<ReceiptImageAnalysis> {
    const model = this.genAI.getGenerativeModel({ model: this.primaryModelName });
    const prompt = buildReceiptAnalysisPrompt(ocrText, this.getCurrentTimeInfo());
    const response = await model.generateContent(prompt);
    return parseReceiptImageAnalysis(response.response.text());
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
    const { duplicateWarnings: _duplicateWarnings, ...payload } = pending.payload;
    const result = await tool.execute(payload, {
      userId,
      botUsername: pending.botUsername,
    });
    return { referenceId: pending.referenceId, name: pending.name, result };
  }

  private async addTaskDuplicateWarnings(
    name: string,
    payload: Record<string, unknown>,
    userId: number,
  ): Promise<Record<string, unknown>> {
    if (!this.taskCreationTools.has(name)) return payload;

    const requestedTitles =
      name === 'create_task'
        ? typeof payload.title === 'string'
          ? [payload.title]
          : []
        : Array.isArray(payload.tasks)
          ? payload.tasks.flatMap((task) => {
              if (!task || typeof task !== 'object') return [];
              const title = (task as Record<string, unknown>).title;
              return typeof title === 'string' ? [title] : [];
            })
          : [];

    if (requestedTitles.length === 0) return payload;

    try {
      const duplicateWarnings = await this.tasksService.findPotentialDuplicateTasks(
        requestedTitles,
        userId,
      );
      return duplicateWarnings.length > 0 ? { ...payload, duplicateWarnings } : payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not check Google Tasks duplicates: ${message}`);
      return payload;
    }
  }

  public cancelPendingAction(actionId: string, userId: number): boolean {
    const pending = this.pendingActions.get(actionId);
    if (!pending || pending.userId !== userId) return false;
    this.pendingActions.delete(actionId);
    return true;
  }

  public getPendingReceiptUrl(actionId: string, userId: number): string | undefined {
    const pending = this.pendingActions.get(actionId);
    if (!pending || pending.userId !== userId) return undefined;
    return typeof pending.payload.receiptUrl === 'string' ? pending.payload.receiptUrl : undefined;
  }

  public attachMessageToPendingAction(
    actionId: string,
    chatId: number | string,
    messageId: number,
  ): void {
    const pending = this.pendingActions.get(actionId);
    if (pending) {
      pending.chatId = chatId;
      pending.messageId = messageId;
    }
  }

  public cancelPendingActionsForUser(userId: number): Array<PendingToolAction & { id: string }> {
    const cancelled: Array<PendingToolAction & { id: string }> = [];
    for (const [id, action] of this.pendingActions.entries()) {
      if (action.userId === userId) {
        this.pendingActions.delete(id);
        cancelled.push({ ...action, id });
      }
    }
    return cancelled;
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
    const finalPayload = { ...payload };
    if (name === 'create_finance_transaction' && !finalPayload.occurredAt) {
      finalPayload.occurredAt = this.getCurrentTimeInfo().nowIso;
    }
    if (name === 'create_finance_transactions' && Array.isArray(finalPayload.transactions)) {
      const nowIso = this.getCurrentTimeInfo().nowIso;
      finalPayload.transactions = finalPayload.transactions.map((tx: unknown) => {
        if (tx && typeof tx === 'object') {
          const item = tx as Record<string, unknown>;
          return {
            ...item,
            occurredAt: item.occurredAt || nowIso,
          };
        }
        return tx;
      });
    }
    const id = randomUUID();
    const referenceId = `REQ-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    this.pendingActions.set(id, {
      referenceId,
      userId,
      botUsername,
      name,
      payload: finalPayload,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return { id, referenceId, name, payload: finalPayload };
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
            const payload = await this.addTaskDuplicateWarnings(
              call.name,
              call.args as Record<string, unknown>,
              userId,
            );
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
