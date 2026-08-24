import assert from 'node:assert/strict';
import test from 'node:test';
import { TelegramUiService } from './telegram-ui.service';

function getCallbackData(button: unknown): string | undefined {
  if (typeof button !== 'object' || button === null || !('callback_data' in button)) {
    return undefined;
  }

  const { callback_data: callbackData } = button;
  return typeof callbackData === 'string' ? callbackData : undefined;
}

void test('buildMainMenuInlineMarkup requests a fresh Dashboard link by callback', () => {
  const menu = new TelegramUiService().buildMainMenuInlineMarkup(false, true, '');
  const reportButton = menu.reply_markup.inline_keyboard
    .flat()
    .find((button) => button.text === '📊 Tổng quan');

  assert.equal(reportButton?.text, '📊 Tổng quan');
  assert.equal(getCallbackData(reportButton), 'action:view_reports');
  assert.equal('url' in (reportButton ?? {}), false);
});

void test('groups the main menu into compact rows of two controls', () => {
  const menu = new TelegramUiService().buildMainMenuInlineMarkup(true, true, '');
  const rows = menu.reply_markup.inline_keyboard;

  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.length <= 2));
  assert.equal(
    getCallbackData(rows.flat().find((button) => button.text === '📊 Tổng quan')),
    'action:view_reports',
  );
  assert.equal(
    getCallbackData(rows.flat().find((button) => button.text === '👥 Danh sách user')),
    'action:refresh_users',
  );
  assert.equal(
    getCallbackData(rows.flat().find((button) => button.text === '⏰ Lời nhắc')),
    'action:view_reminders',
  );
});

void test('buildRemindersMarkup generates cancel buttons and refresh control', () => {
  const markup = new TelegramUiService().buildRemindersMarkup([
    { id: 'rem-1', title: 'Tắt bếp' },
    { id: 'rem-2', title: 'Uống thuốc' },
  ]);

  const rows = markup?.reply_markup.inline_keyboard ?? [];
  assert.equal(rows.length, 2);
  assert.equal(getCallbackData(rows[0][0]), 'cancel_reminder:rem-1');
  assert.equal(getCallbackData(rows[0][1]), 'cancel_reminder:rem-2');
  assert.equal(getCallbackData(rows[1][0]), 'action:refresh_reminders');
  assert.equal(getCallbackData(rows[1][1]), 'message:close');
});

void test('buildMainMenuInlineMarkup has the same menu for start and help inputs', () => {
  const service = new TelegramUiService();
  const startMenu = service.buildMainMenuInlineMarkup(true, true, '');
  const helpMenu = service.buildMainMenuInlineMarkup(true, true, '');

  assert.deepEqual(helpMenu.reply_markup, startMenu.reply_markup);
});

void test('formats finance confirmation with JSON payload and details', () => {
  const message = new TelegramUiService().formatConfirmationBox(
    'create_finance_transaction',
    {
      type: 'expense',
      amount: 65000,
      category: 'Ăn uống',
      note: 'Cơm trưa',
      occurredAt: '2026-08-24T12:30:00+07:00',
    },
    'REQ-ABC123',
  );

  assert.match(message, /XÁC NHẬN THU–CHI/);
  assert.match(message, /65\.000đ/);
  assert.match(message, /Ngày phát sinh/);
  assert.match(message, /Payload JSON/);
  assert.match(message, /"type": "expense"/);
  assert.match(message, /"amount": 65000/);
  assert.match(message, /"occurredAt": "2026-08-24T12:30:00\+07:00"/);
  assert.match(message, /REQ-ABC123/);
});

void test('warns about potential duplicate Google Tasks without blocking confirmation', () => {
  const message = new TelegramUiService().formatConfirmationBox(
    'create_task',
    {
      title: 'Học C# (ánh xạ bằng TS)',
      duplicateWarnings: [
        {
          requestedTitle: 'Học C# (ánh xạ bằng TS)',
          matches: [{ id: 'task-1', title: 'Học C#' }],
        },
      ],
    },
    'REQ-ABC123',
  );

  assert.match(message, /Có thể trùng/);
  assert.match(message, /Học C#/);
  assert.match(message, /vẫn có thể xác nhận/i);
});

void test('groups compact task completion controls and provides a close control', () => {
  const markup = new TelegramUiService().buildTaskChecklistMarkup([
    { id: 'one', title: 'Việc 1' },
    { id: 'two', title: 'Việc 2' },
    { id: 'three', title: 'Việc 3' },
  ]);

  const rows = markup?.reply_markup.inline_keyboard ?? [];
  assert.equal(rows.length, 3);
  assert.equal(rows[0].length, 2);
  assert.equal(rows[1].length, 1);
  assert.equal(getCallbackData(rows[0][0]), 'complete_task:one');
  assert.equal(getCallbackData(rows[0][1]), 'complete_task:two');
  assert.equal(getCallbackData(rows[1][0]), 'complete_task:three');
  assert.equal(rows[2][0].text, '❌ Đóng');
  assert.equal(getCallbackData(rows[2][0]), 'message:close');
});

void test('provides close controls for today and admin lists', () => {
  const service = new TelegramUiService();

  for (const markup of [service.buildTodayActionsMarkup(), service.buildAdminUsersMarkup()]) {
    const closeButton = markup.reply_markup.inline_keyboard
      .flat()
      .find((button) => button.text === '❌ Đóng');
    assert.equal(getCallbackData(closeButton), 'message:close');
  }
});

void test('uses scope-specific refresh controls for today and week summaries', () => {
  const service = new TelegramUiService();
  const todayButtons = service.buildTodayActionsMarkup().reply_markup.inline_keyboard.flat();
  const weekButtons = service.buildWeekActionsMarkup().reply_markup.inline_keyboard.flat();

  assert.equal(todayButtons[0].text, '🔄 Cập nhật lịch hôm nay');
  assert.equal(getCallbackData(todayButtons[0]), 'action:refresh_today');
  assert.equal(weekButtons[0].text, '🔄 Cập nhật lịch 7 ngày');
  assert.equal(getCallbackData(weekButtons[0]), 'action:refresh_week');
});

void test('normalizes HTML entities and escaped URL ampersands before sending Markdown', async () => {
  const replies: string[] = [];
  const ctx = {
    reply: async (text: string) => {
      replies.push(text);
      await Promise.resolve();
    },
  };

  await new TelegramUiService().sendSafeReply(
    ctx as never,
    '📍&#x20;[Mở lịch](https://example.test/event?eid=abc\\&ctz=Asia/Ho_Chi_Minh)',
  );

  assert.equal(replies[0], '📍 [Mở lịch](https://example.test/event?eid=abc&ctz=Asia/Ho_Chi_Minh)');
});

void test('provides a close control for each debt detail', () => {
  const buttons = new TelegramUiService()
    .buildDebtActionsMarkup('debt-1')
    .reply_markup.inline_keyboard.flat();

  assert.equal(
    getCallbackData(buttons.find((button) => button.text === '💵 Trả nợ')),
    'debt:pay:debt-1',
  );
  assert.equal(
    getCallbackData(buttons.find((button) => button.text === '🗑️ Xóa khoản này')),
    'debt:delete:debt-1',
  );
  assert.equal(getCallbackData(buttons.find((button) => button.text === '❌ Đóng')), 'debt:close');
});

void test('formats completed task results without technical JSON', () => {
  const message = new TelegramUiService().formatResultBox(
    'complete_task',
    { success: true, task: { title: 'Học Java' } },
    'REQ-ABC123',
  );

  assert.match(message, /Đã hoàn thành/);
  assert.match(message, /Học Java/);
  assert.doesNotMatch(message, /JSON|taskId|API/);
});

void test('formats create_task confirmation with full structure (title, notes, due)', () => {
  const message = new TelegramUiService().formatConfirmationBox(
    'create_task',
    {
      title: 'Nộp báo cáo tài chính',
      notes: 'Đính kèm file excel tháng 8',
      due: '2026-08-25T17:00:00.000Z',
    },
    'REQ-TSK001',
  );

  assert.match(message, /XÁC NHẬN THÊM VIỆC/);
  assert.match(message, /Nộp báo cáo tài chính/);
  assert.match(message, /Đính kèm file excel tháng 8/);
  assert.match(message, /Hạn chót/);
  assert.match(message, /REQ-TSK001/);
});

void test('formats create_tasks confirmation with multiple tasks including notes and due', () => {
  const message = new TelegramUiService().formatConfirmationBox(
    'create_tasks',
    {
      tasks: [
        {
          title: 'Mua sữa tươi',
          notes: '2 hộp không đường',
          due: '2026-08-24T20:00:00.000Z',
        },
        {
          title: 'Gửi email cho đối tác',
          due: '2026-08-25T09:00:00.000Z',
        },
      ],
    },
    'REQ-TSK002',
  );

  assert.match(message, /1\. <b>Mua sữa tươi<\/b>/);
  assert.match(message, /2 hộp không đường/);
  assert.match(message, /2\. <b>Gửi email cho đối tác<\/b>/);
  assert.match(message, /Hạn chót/);
});

void test('formats create_task result box with due date', () => {
  const message = new TelegramUiService().formatResultBox(
    'create_task',
    {
      success: true,
      task: {
        title: 'Nộp bài kiểm tra',
        due: '2026-08-25T23:59:59.000Z',
      },
    },
    'REQ-TSK003',
  );

  assert.match(message, /Đã thêm việc/);
  assert.match(message, /Nộp bài kiểm tra/);
  assert.match(message, /Hạn:/);
});

void test('formats create_finance_transaction result box with details and date', () => {
  const message = new TelegramUiService().formatResultBox(
    'create_finance_transaction',
    {
      success: true,
      transaction: {
        id: 'tx-123',
        type: 'expense',
        amount: 65000,
        amountText: '65.000đ',
        category: 'Ăn uống',
        note: 'Cơm trưa',
        occurredAt: '2026-08-24T12:30:00+07:00',
      },
    },
    'REQ-FIN001',
  );

  assert.match(message, /Đã ghi sổ thu–chi/);
  assert.match(message, /Khoản chi/);
  assert.match(message, /65\.000đ/);
  assert.match(message, /Ăn uống/);
  assert.match(message, /Cơm trưa/);
  assert.match(message, /24\/08\/2026/);
});
