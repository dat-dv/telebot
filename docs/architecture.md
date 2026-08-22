# 🏛️ Kiến Trúc Hệ Thống (System Architecture)

Tài liệu này mô tả chi tiết kiến trúc tổng thể, luồng dữ liệu và các nguyên lý thiết kế cốt lõi của **NestJS Telegram AI Assistant**.

---

## 1. Bức Tranh Tổng Thể (High-Level Overview)

Dự án được xây dựng theo mô hình **Modular Monolith** trên nền tảng **NestJS**, hỗ trợ **Kiến trúc Đa Người Dùng (Multi-Tenant Isolation)** kết nối 4 thực thể chính:

1. **Người dùng Telegram**: Gửi yêu cầu qua ngôn ngữ tự nhiên tiếng Việt hoặc qua các lệnh tắt (Slash Commands).
2. **Tầng Phân Quyền & Quản Lý Người Dùng (`UsersModule`)**: Quản lý lời mời kích hoạt Deep Link (`/invite`), danh sách trắng động và chống Rate Limit.
3. **Bộ não Google Gemini AI (`gemini-3.5-flash-lite`)**: Phân tích ngữ cảnh, neo thời gian thực tế, gọi Function Calling đa bước và tự động fallback model.
4. **Google Workspace (Calendar & Tasks)**: Dịch vụ thực thi dữ liệu qua OAuth2 được cô lập độc lập cho từng người dùng (`data/tokens/<userId>.json`).

```mermaid
graph TD
    User([Người dùng Telegram]) <-->|Message / Slash Command| TG[Telegram Bot Layer]
    TG -->|AuthGuard| Guard{Được phép & Trong Quota?}
    Guard -- No --> Reject[Từ chối / Yêu cầu Invite / Báo Cooldown]
    Guard -- Yes --> Handler[Telegram Update Handler]
    
    Handler <-->|Prompt + User Context| Gemini[Gemini AI Service]
    Gemini <-->|Function Declarations & Calls| Tools[Gemini Tools Layer]
    Tools <-->|OAuth2 Per-User Token| Google[Google Workspace Layer]
    
    subgraph Multi-Tenant Data Storage
        Google --> GCal[Google Calendar API - Đúng tài khoản người gửi]
        Google --> GTasks[Google Tasks API - Đúng tài khoản người gửi]
    end
```

---

## 2. Cấu Trúc Module NestJS

Hệ thống tuân thủ nghiêm ngặt nguyên lý **Separation of Concerns (SoC)** và **Dependency Injection (DI)** của NestJS:

```text
src/
├── app.module.ts               # Root Module kết nối Config, Users, Telegram, Gemini, Google
├── main.ts                     # Khởi tạo NestJS Context
├── config/
│   └── configuration.ts        # Load & validate biến môi trường .env
├── users/                      # TẦNG QUẢN LÝ NGƯỜI DÙNG & RATE LIMITING
│   ├── user.entity.ts          # Schema UserProfile, InviteCode, UserUsage
│   ├── users.service.ts        # Lưu trữ data/users.json, Invite Token, Rate Limiter
│   └── users.module.ts
├── telegram/                   # TẦNG GIAO TIẾP TELEGRAM
│   ├── guards/auth.guard.ts    # Kiểm tra Whitelist động, Deep-link invite & Rate limit
│   ├── telegram.update.ts      # Xử lý Slash Commands (/invite, /login, /code, /status...)
│   └── telegram.module.ts
├── gemini/                     # TẦNG TRÍ TUỆ NHÂN TẠO (AI CORE)
│   ├── tools/                  # Triển khai các Tool Function Calling (có User Context)
│   │   ├── tool.interface.ts   # Interface chuẩn GeminiTool & ToolExecutionContext
│   │   ├── create-calendar.tool.ts
│   │   ├── list-calendar.tool.ts
│   │   ├── delete-calendar.tool.ts
│   │   ├── create-task.tool.ts
│   │   ├── list-tasks.tool.ts
│   │   └── complete-task.tool.ts
│   ├── gemini.service.ts       # Prompt Injection, Fallback Model Chain, Loop Function Call
│   └── gemini.module.ts
└── google/                     # TẦNG GOOGLE WORKSPACE APIS (MULTI-TENANT)
    ├── google-auth.service.ts  # Quản lý OAuth2 per-user (data/tokens/<userId>.json), generateAuthUrl, code exchange
    ├── google-calendar.service.ts # Calendar API per-user + 4 mốc nhắc nhở dồn dập
    ├── google-tasks.service.ts    # Tasks API per-user (@default tasklist)
    └── google.module.ts
```

---

## 3. Sơ Đồ Luồng Dữ Liệu Chi Tiết (Sequence Flow)

Luồng hoạt động khi người dùng gửi một tin nhắn tự nhiên (Ví dụ: *"Mai 14h họp dự án tại phòng 302 nhé"*):

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Telegram ID)
    participant TG as Telegram Bot
    participant Guard as AuthGuard
    participant Users as UsersService
    participant Update as TelegramUpdate
    participant Gemini as GeminiService
    participant AI as Google Gemini AI
    participant Tool as CreateCalendarTool
    participant GService as GoogleCalendarService
    participant GAuth as GoogleAuthService
    participant GoogleAPI as Google Cloud API

    User->>TG: Gửi tin nhắn "Mai 14h họp..."
    TG->>Guard: canActivate(context)
    Guard->>Users: isAllowed(userId) & checkRateLimit(userId)
    Users-->>Guard: Cho phép (Pass)
    TG->>Update: onTextMessage(ctx)
    Update->>TG: Bật typing status (withTyping heartbeat 4s)
    Update->>Gemini: chat("Mai 14h họp...", [], userId)
    Gemini->>Gemini: getCurrentTimeInfo() (Neo mốc giờ thực tế Asia/Ho_Chi_Minh)
    Gemini->>AI: sendMessage(Prompt + Tools Declaration)
    AI-->>Gemini: Yêu cầu Function Call: create_calendar_event(args)
    Gemini->>Tool: execute(args, { userId })
    Tool->>GService: createEvent(options, userId)
    GService->>GAuth: getOAuth2Client(userId)
    GAuth-->>GService: OAuth2Client riêng của userId
    GService->>GoogleAPI: events.insert (với 4 mốc chuông [60p, 30p, 10p, 0p])
    GoogleAPI-->>GService: Event Created (200 OK)
    GService-->>Tool: Event Data
    Tool-->>Gemini: Tool Result (success: true)
    Gemini->>AI: sendMessage(functionResponse)
    AI-->>Gemini: Trả lời văn bản hoàn chỉnh bằng tiếng Việt
    Gemini-->>Update: Kết quả cuối cùng
    Update->>TG: sendSafeReply(chunked & safe Markdown)
    TG-->>User: Hiển thị phản hồi đẹp mắt có Emoji
```

---

## 4. Các Nguyên Lý Thiết Kế Cốt Lõi (Core Principles)

### 1. Cô Lập Dữ Liệu Đa Người Dùng (Multi-Tenant Token Isolation)
- Mỗi người dùng có một file lưu trữ Token Google độc lập tại `data/tokens/<userId>.json`.
- Mọi thao tác đọc/ghi lịch của User A được thực thi với Token của User A, tuyệt đối không truy cập chéo vào dữ liệu của Admin hay người khác.

### 2. Neo Thời Gian Thực Tế (Realtime Timestamp Injection)
- Mỗi lượt gọi chat, `GeminiService.getCurrentTimeInfo()` lấy thời gian hệ thống chính xác theo múi giờ `Asia/Ho_Chi_Minh` và chèn vào System Instruction làm mốc quy chiếu chuẩn tuyệt đối cho các từ ngữ tương đối ("mai", "tuần sau", "3 ngày nữa").

### 3. Vòng Lặp Function Calling (Multi-turn Tool Loop)
- `GeminiService` cài đặt vòng lặp `while (functionCalls && iterations < MAX_ITERATIONS)` với chặn tối đa 6 bước để xử lý tuần tự nhiều tool liên tiếp và ngăn chặn lặp vô hạn.

### 4. Chuỗi Fallback Model Tự Động (Resilient AI Model Fallback)
- Mặc định sử dụng model `gemini-3.5-flash-lite` (500 lượt/ngày miễn phí) với chuỗi dự phòng:
  $$\text{gemini-3.5-flash-lite} \longrightarrow \text{gemini-3.5-flash} \longrightarrow \text{gemini-3.6-flash}$$

### 5. Phòng Thủ Rate Limit 4 Lớp (Rate Limiting Shield)
- **Cooldown Throttling (2s)**: Chống spam gửi liên tiếp.
- **Fair-use Daily Limit**: Phân bổ hạn mức ngày (Admin 500, Khách 100 tin/ngày).
- **Hàng đợi & Typing Heartbeat**: Giữ kết nối mượt mà trên Telegram.
