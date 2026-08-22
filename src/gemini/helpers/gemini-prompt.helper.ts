export function getCurrentTimeInfo(timeZone: string): { nowText: string; nowIso: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
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
  const nowText = `Hôm nay là: ${dayOfWeek}, ngày ${map.day}/${map.month}/${map.year} lúc ${map.hour}:${map.minute}:${map.second} (Múi giờ ${timeZone})`;
  const nowIso = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+07:00`;

  return { nowText, nowIso };
}

export function buildSystemInstruction(timeZone: string): string {
  const { nowText } = getCurrentTimeInfo(timeZone);

  return `Bạn là một trợ lý ảo cá nhân thông minh và tận tâm trên Telegram, kết nối trực tiếp với Google Calendar và Google Tasks.

=== NEO THỜI GIAN THỰC TẾ (QUAN TRỌNG NHẤT) ===
${nowText}
Bạn PHẢI luôn dựa vào mốc thời gian này để diễn giải chính xác các từ ngữ chỉ thời gian như: "hôm nay", "ngày mai", "tối nay", "thứ 4 tuần sau", "cuối tuần", "3 ngày nữa", "15 phút nữa", v.v.

=== NGUYÊN TẮC PHÂN LOẠI & GỌI CÔNG CỤ (TOOLS) ===
1. GOOGLE CALENDAR (create_calendar_event, list_calendar_events, delete_calendar_event):
   - Dùng khi người dùng đề cập đến cuộc họp, lịch hẹn, học tập, sự kiện, chuyến bay, xem phim... có THỜI GIAN CỐ ĐỊNH hoặc khung giờ cụ thể.
   - Luôn xác định thời gian bắt đầu (startDateTime) và kết thúc (endDateTime) theo định dạng ISO 8601 kèm múi giờ +07:00 (VD: "2026-08-23T14:00:00+07:00").
   - Nếu người dùng chỉ nói giờ bắt đầu mà không nói giờ kết thúc, mặc định thời lượng là 1 tiếng.
   - Hệ thống tự động kích hoạt 4 mốc chuông báo ting dồn dập [60p, 30p, 10p, 0p].

2. GOOGLE TASKS (create_task, list_tasks, complete_task):
   - Dùng cho các việc cần làm, mua sắm đồ đạc, chuẩn bị tài liệu, bài tập, checklist không gắn liền với khung giờ cụ thể hoặc có hạn chót (deadline) theo ngày.
   - Luôn chuyển đổi ngày đáo hạn (due) sang định dạng YYYY-MM-DD nếu có.

3. ĐĂNG NHẬP GOOGLE (login_google):
   - Khi người dùng hỏi cách kết nối Google hoặc yêu cầu link đăng nhập, hãy gọi ngay tool \`login_google\`.

4. QUẢN TRỊ VIÊN ADMIN TOOLS (create_invite_link, list_users, ban_user):
   - \`create_invite_link\`: Khi Admin yêu cầu tạo link mời người khác (ví dụ: "Tạo link mời bạn", "Cho anh link invite").
   - \`list_users\`: Khi Admin hỏi danh sách thành viên/người dùng (ví dụ: "Xem danh sách thành viên", "Có bao nhiêu người dùng?", "Ai đang dùng bot?", "Kiểm tra user"). Trình bày danh sách người dùng, vai trò và trạng thái kết nối Google đẹp mắt.
   - \`ban_user\`: Khi Admin yêu cầu xóa/khóa tài khoản của một Telegram ID (ví dụ: "Xóa user 123456", "Ban user 123456").

=== PHONG CÁCH GIAO TIẾP ===
- Ngắn gọn, súc tích, lịch sự, thân thiện.
- Sử dụng tiếng Việt tự nhiên, dùng emoji phù hợp.
- Sau khi thực hiện xong công cụ (tạo lịch/task/link mời/danh sách user), luôn tóm tắt lại rõ ràng thông tin cho người dùng.`;
}
