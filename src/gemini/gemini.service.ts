import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  Part,
  Content,
} from '@google/generative-ai';
import { GeminiTool } from './tools/tool.interface';
import { CreateCalendarTool } from './tools/create-calendar.tool';
import { ListCalendarTool } from './tools/list-calendar.tool';
import { DeleteCalendarTool } from './tools/delete-calendar.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { ListTasksTool } from './tools/list-tasks.tool';
import { CompleteTaskTool } from './tools/complete-task.tool';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private toolsMap: Map<string, GeminiTool> = new Map();
  private readonly defaultTimeZone: string;
  private primaryModelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly createCalendarTool: CreateCalendarTool,
    private readonly listCalendarTool: ListCalendarTool,
    private readonly deleteCalendarTool: DeleteCalendarTool,
    private readonly createTaskTool: CreateTaskTool,
    private readonly listTasksTool: ListTasksTool,
    private readonly completeTaskTool: CompleteTaskTool,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey', '');
    const rawModel = this.configService.get<string>('gemini.model', 'gemini-3.5-flash-lite');
    this.primaryModelName =
      !rawModel || rawModel === 'gemini-2.0-flash' || rawModel === 'gemini-1.5-flash'
        ? 'gemini-3.5-flash-lite'
        : rawModel;
    this.defaultTimeZone = this.configService.get<string>('timezone', 'Asia/Ho_Chi_Minh');

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Register all tools
    const tools: GeminiTool[] = [
      this.createCalendarTool,
      this.listCalendarTool,
      this.deleteCalendarTool,
      this.createTaskTool,
      this.listTasksTool,
      this.completeTaskTool,
    ];

    for (const tool of tools) {
      this.toolsMap.set(tool.name, tool);
    }
  }

  public getCurrentTimeInfo(): { nowText: string; nowIso: string } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.defaultTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    const weekdayMap: Record<string, string> = {
      Mon: 'Thứ Hai',
      Tue: 'Thứ Ba',
      Wed: 'Thứ Tư',
      Thu: 'Thứ Năm',
      Fri: 'Thứ Sáu',
      Sat: 'Thứ Bảy',
      Sun: 'Chủ Nhật',
    };

    const dayOfWeek = weekdayMap[map.weekday] || map.weekday;
    const nowText = `Hôm nay là: ${dayOfWeek}, ngày ${map.day}/${map.month}/${map.year} lúc ${map.hour}:${map.minute}:${map.second} (Múi giờ ${this.defaultTimeZone})`;
    const nowIso = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+07:00`;

    return { nowText, nowIso };
  }

  private buildSystemInstruction(): string {
    const { nowText } = this.getCurrentTimeInfo();

    return `Bạn là một trợ lý ảo cá nhân thông minh và tận tâm trên Telegram, kết nối trực tiếp với Google Calendar và Google Tasks.

=== NEO THỜI GIAN THỰC TẾ (QUAN TRỌNG NHẤT) ===
${nowText}
Bạn PHẢI luôn dựa vào mốc thời gian này để diễn giải chính xác các từ ngữ chỉ thời gian như: "hôm nay", "ngày mai", "tối nay", "thứ 4 tuần sau", "cuối tuần", "3 ngày nữa", "15 phút nữa", v.v.

=== NGUYÊN TẮC PHÂN LOẠI CALENDAR VS TASKS ===
1. GOOGLE CALENDAR (Sự kiện / Lịch hẹn):
   - Dùng khi người dùng đề cập đến cuộc họp, lịch hẹn, học tập, sự kiện, chuyến bay, xem phim... có THỜI GIAN CỐ ĐỊNH hoặc khung giờ cụ thể.
   - Luôn xác định thời gian bắt đầu (startDateTime) và kết thúc (endDateTime) theo định dạng ISO 8601 kèm múi giờ +07:00 (VD: "2026-08-23T14:00:00+07:00").
   - Nếu người dùng chỉ nói giờ bắt đầu mà không nói giờ kết thúc, mặc định thời lượng là 1 tiếng.
   - Hệ thống tự động kích hoạt 4 mốc chuông báo ting dồn dập [60p, 30p, 10p, 0p].

2. GOOGLE TASKS (Việc cần làm / To-Do):
   - Dùng cho các việc cần làm, mua sắm đồ đạc, chuẩn bị tài liệu, bài tập, checklist không gắn liền với khung giờ cụ thể hoặc có hạn chót (deadline) theo ngày.
   - Có thể gán deadline (due) nếu người dùng có nhắc đến hạn chót.

=== QUY TRÌNH FUNCTION CALLING ===
- Khi người dùng yêu cầu tạo, tra cứu, xóa lịch hoặc việc cần làm, hãy gọi ngay công cụ (tool) tương ứng.
- Khi người dùng muốn xem lịch hôm nay/tuần này hoặc tổng hợp, hãy gọi list_calendar_events và list_tasks để lấy dữ liệu thực tế rồi tổng hợp lại.
- Nếu tool trả về lỗi người dùng chưa liên kết Google (yêu cầu /login), hãy nhắc nhở lịch sự và hướng dẫn họ gõ /login để kết nối.
- Sau khi thực hiện xong công cụ, hãy trả lời người dùng một cách rõ ràng, súc tích, thân thiện bằng tiếng Việt.
- Định dạng tin nhắn đẹp mắt với các emoji thích hợp (📅, ⏰, 📍, ✅, 📝, 📌, 🚀) và cấu trúc danh sách dễ đọc trên Telegram.`;
  }

  private getGenerativeModel(modelName: string): GenerativeModel {
    const systemInstruction = this.buildSystemInstruction();
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
  ): Promise<string> {
    const candidateModels = [
      this.primaryModelName,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
    ];

    // Remove duplicates while keeping order
    const uniqueModels = Array.from(new Set(candidateModels));

    let lastError: Error | null = null;

    for (const modelName of uniqueModels) {
      try {
        const text = await this.executeChatWithModel(modelName, userMessage, chatHistory, userId);
        return text;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Model ${modelName} encountered error: ${lastError.message}. Attempting fallback...`,
        );
      }
    }

    this.logger.error(
      `All model candidates failed. Last error: ${lastError?.message}`,
      lastError?.stack,
    );
    return `⚠️ Đã xảy ra lỗi khi xử lý yêu cầu với Gemini AI: ${lastError?.message || 'Không có phản hồi'}`;
  }

  private async executeChatWithModel(
    modelName: string,
    userMessage: string,
    chatHistory: Content[] = [],
    userId?: number,
  ): Promise<string> {
    const model = this.getGenerativeModel(modelName);
    const chat: ChatSession = model.startChat({
      history: chatHistory,
    });

    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    let functionCalls = response.functionCalls();

    // Function calling loop (tối đa 6 bước để tránh lặp vô hạn)
    let iterations = 0;
    const MAX_ITERATIONS = 6;

    while (functionCalls && functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      this.logger.log(
        `[${modelName}] Executing ${functionCalls.length} function call(s) for user ${userId || 'default'} (Iteration ${iterations}): ${functionCalls.map((f) => f.name).join(', ')}`,
      );

      const functionResponses: Part[] = await Promise.all(
        functionCalls.map(async (call) => {
          const tool = this.toolsMap.get(call.name);
          let toolResult: Record<string, unknown>;

          if (tool) {
            try {
              toolResult = await tool.execute(call.args as Record<string, unknown>, { userId });
            } catch (err) {
              const error = err as Error;
              this.logger.error(`Error executing tool ${call.name}: ${error.message}`, error.stack);
              toolResult = { success: false, error: error.message };
            }
          } else {
            this.logger.warn(`Tool not found: ${call.name}`);
            toolResult = {
              success: false,
              error: `Tool ${call.name} not supported`,
            };
          }

          return {
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          };
        }),
      );

      // Send function responses back to Gemini
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    const text = response.text();
    return text || 'Đã xử lý xong yêu cầu của bạn.';
  }

  public async getTodaySummary(userId?: number): Promise<string> {
    const prompt =
      'Hãy kiểm tra và tóm tắt toàn bộ lịch hẹn (Google Calendar) và các việc cần làm (Google Tasks) của TÔI TRONG NGÀY HÔM NAY. Trình bày rõ ràng theo từng phần.';
    return this.chat(prompt, [], userId);
  }

  public async getWeekSummary(userId?: number): Promise<string> {
    const prompt =
      'Hãy kiểm tra và tổng hợp toàn bộ lịch trình, sự kiện và công việc cần làm trong 7 NGÀY TỚI của tôi. Trình bày trực quan, có chia theo từng ngày.';
    return this.chat(prompt, [], userId);
  }
}
