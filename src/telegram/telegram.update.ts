import { Update, Start, Help, Command, On, Ctx } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { AuthGuard } from './guards/auth.guard';
import { GeminiService } from '../gemini/gemini.service';

@Update()
@UseGuards(AuthGuard)
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(private readonly geminiService: GeminiService) {}

  @Start()
  public async onStart(@Ctx() ctx: Context): Promise<void> {
    const fromName = ctx.from?.first_name || 'bạn';
    const welcomeMessage = `👋 Xin chào *${fromName}*! Tôi là trợ lý AI cá nhân kết nối trực tiếp với *Google Calendar* và *Google Tasks*.

🚀 *Các lệnh nhanh hỗ trợ:*
• \`/today\` - Tóm tắt toàn bộ lịch hẹn & to-do list hôm nay
• \`/week\` - Tổng quan lịch trình & việc cần làm 7 ngày tới
• \`/calendar <nội dung>\` - Lên lịch hẹn mới nhanh chóng
• \`/task <nội dung>\` - Thêm công việc to-do mới
• \`/help\` - Xem hướng dẫn sử dụng chi tiết

💬 Hoặc bạn chỉ cần *nhắn tin tự nhiên* bất kỳ lúc nào (ví dụ: _"Chiều mai 3h nhắc tớ họp dự án với team nhé"_, _"Thêm vào to-do mua cà phê"_). AI sẽ tự động phân tích và kích hoạt công cụ chuẩn xác!`;

    await this.sendSafeReply(ctx, welcomeMessage);
  }

  @Help()
  @Command('help')
  public async onHelp(@Ctx() ctx: Context): Promise<void> {
    const helpMessage = `📖 *HƯỚNG DẪN SỬ DỤNG TRỢ LÝ AI GOOGLE WORKSPACE*

1️⃣ *Quản lý Google Calendar (Lịch hẹn / Họp có giờ cố định)*
• _"Mai 14h họp kickoff dự án tại phòng họp A"_
• _"Thứ 6 tuần này từ 9h đến 11h đi khám sức khỏe"_
• _"Hôm nay tớ có lịch gì không?"_
• _"Xóa lịch họp lúc 14h chiều mai"_
• Tự động cài 4 mốc chuông popup báo dồn dập (60p, 30p, 10p, 0p) 🔔

2️⃣ *Quản lý Google Tasks (To-Do List / Việc cần làm)*
• _"Thêm việc chuẩn bị tài liệu thuyết trình"_
• _"Nhắc tớ đi siêu thị mua trứng và sữa trước chủ nhật"_
• _"Xem danh sách việc cần làm của tớ"_
• _"Đánh dấu đã hoàn thành việc mua sách"_

3️⃣ *Các Slash Commands tiện lợi:*
• \`/today\` - Xem tất cả lịch và task hôm nay
• \`/week\` - Xem tổng thể 7 ngày sắp tới
• \`/calendar <lời nhắc>\` - Tạo lịch hẹn nhanh
• \`/task <công việc>\` - Thêm to-do nhanh`;

    await this.sendSafeReply(ctx, helpMessage);
  }

  @Command('today')
  public async onToday(@Ctx() ctx: Context): Promise<void> {
    const summary = await this.withTyping(ctx, () => this.geminiService.getTodaySummary());
    await this.sendSafeReply(ctx, summary);
  }

  @Command('week')
  public async onWeek(@Ctx() ctx: Context): Promise<void> {
    const summary = await this.withTyping(ctx, () => this.geminiService.getWeekSummary());
    await this.sendSafeReply(ctx, summary);
  }

  @Command('calendar')
  public async onCalendar(@Ctx() ctx: Context): Promise<void> {
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const query = text.replace(/^\/calendar(@\w+)?\s*/i, '').trim();

    if (!query) {
      await ctx.reply(
        'ℹ️ Vui lòng nhập nội dung lịch hẹn sau lệnh. Ví dụ:\n`/calendar Họp khách hàng lúc 15h chiều mai tại Quận 1`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const prompt = `Hãy tạo một sự kiện trên Google Calendar dựa trên yêu cầu sau: "${query}"`;
    const response = await this.withTyping(ctx, () => this.geminiService.chat(prompt));
    await this.sendSafeReply(ctx, response);
  }

  @Command('task')
  public async onTask(@Ctx() ctx: Context): Promise<void> {
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const query = text.replace(/^\/task(@\w+)?\s*/i, '').trim();

    if (!query) {
      await ctx.reply(
        'ℹ️ Vui lòng nhập nội dung công việc sau lệnh. Ví dụ:\n`/task Mua tài liệu ôn thi cuối kỳ`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const prompt = `Hãy thêm một công việc mới vào Google Tasks dựa trên yêu cầu sau: "${query}"`;
    const response = await this.withTyping(ctx, () => this.geminiService.chat(prompt));
    await this.sendSafeReply(ctx, response);
  }

  @On('text')
  public async onTextMessage(@Ctx() ctx: Context): Promise<void> {
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    if (!text) return;

    this.logger.log(`Received text message from ${ctx.from?.id}: "${text}"`);

    const response = await this.withTyping(ctx, () => this.geminiService.chat(text));
    await this.sendSafeReply(ctx, response);
  }

  /**
   * Helper that executes an asynchronous action while maintaining a continuous
   * Telegram 'typing' status action (refreshed every 4 seconds) so the user
   * always sees that the bot is actively processing.
   */
  private async withTyping<T>(ctx: Context, action: () => Promise<T>): Promise<T> {
    // Fire immediate typing action
    ctx.sendChatAction('typing').catch(() => {});

    // Set interval to re-send typing action every 4 seconds
    const interval = setInterval(() => {
      ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
      return await action();
    } finally {
      clearInterval(interval);
    }
  }

  /**
   * Helper safely sending replies with fallback for Markdown parsing errors & chunking large texts
   */
  private async sendSafeReply(ctx: Context, text: string): Promise<void> {
    const MAX_LENGTH = 4000;
    const chunks: string[] = [];

    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }
      let chunk = remaining.slice(0, MAX_LENGTH);
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > 0) {
        chunk = remaining.slice(0, lastNewline);
        remaining = remaining.slice(lastNewline + 1);
      } else {
        remaining = remaining.slice(MAX_LENGTH);
      }
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      try {
        await ctx.reply(chunk, { parse_mode: 'Markdown' });
      } catch (markdownError) {
        const err = markdownError as Error;
        this.logger.warn(`Markdown reply failed, falling back to plain text: ${err.message}`);
        await ctx.reply(chunk);
      }
    }
  }
}
