import assert from 'node:assert/strict';
import test from 'node:test';
import { TelegramUiService } from './telegram-ui.service';

void test('buildMainMenuInlineMarkup requests a fresh Dashboard link by callback', () => {
  const menu = new TelegramUiService().buildMainMenuInlineMarkup(false, true, '');
  const reportButton = menu.reply_markup.inline_keyboard
    .flat()
    .find((button) => button.text === '📊 Dashboard');

  assert.equal(reportButton?.text, '📊 Dashboard');
  assert.equal(reportButton?.callback_data, 'action:view_reports');
  assert.equal('url' in (reportButton ?? {}), false);
});

void test('groups the main menu into compact rows of two controls', () => {
  const menu = new TelegramUiService().buildMainMenuInlineMarkup(true, true, '');
  const rows = menu.reply_markup.inline_keyboard;

  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.length <= 2));
  assert.equal(
    rows.flat().find((button) => button.text === '📊 Dashboard')?.callback_data,
    'action:view_reports',
  );
  assert.equal(
    rows.flat().find((button) => button.text === '👥 Danh sách user')?.callback_data,
    'action:refresh_users',
  );
});

void test('buildMainMenuInlineMarkup has the same menu for start and help inputs', () => {
  const service = new TelegramUiService();
  const startMenu = service.buildMainMenuInlineMarkup(true, true, '');
  const helpMenu = service.buildMainMenuInlineMarkup(true, true, '');

  assert.deepEqual(helpMenu.reply_markup, startMenu.reply_markup);
});

void test('formats finance confirmation as compact mobile-friendly text', () => {
  const message = new TelegramUiService().formatConfirmationBox(
    'create_finance_transaction',
    { type: 'expense', amount: 65000, category: 'Ăn uống', note: 'Cơm trưa' },
    'REQ-ABC123',
  );

  assert.match(message, /XÁC NHẬN THU–CHI/);
  assert.match(message, /65\.000đ/);
  assert.doesNotMatch(message, /Payload JSON/);
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
  assert.equal(rows[0][0].callback_data, 'complete_task:one');
  assert.equal(rows[0][1].callback_data, 'complete_task:two');
  assert.equal(rows[1][0].callback_data, 'complete_task:three');
  assert.equal(rows[2][0].text, '❌ Đóng');
  assert.equal(rows[2][0].callback_data, 'message:close');
});

void test('provides close controls for today and admin lists', () => {
  const service = new TelegramUiService();

  for (const markup of [service.buildTodayActionsMarkup(), service.buildAdminUsersMarkup()]) {
    const closeButton = markup.reply_markup.inline_keyboard
      .flat()
      .find((button) => button.text === '❌ Đóng');
    assert.equal(closeButton?.callback_data, 'message:close');
  }
});

void test('provides a close control for each debt detail', () => {
  const buttons = new TelegramUiService()
    .buildDebtActionsMarkup('debt-1')
    .reply_markup.inline_keyboard.flat();

  assert.equal(
    buttons.find((button) => button.text === '💵 Trả nợ')?.callback_data,
    'debt:pay:debt-1',
  );
  assert.equal(
    buttons.find((button) => button.text === '🗑️ Xóa khoản này')?.callback_data,
    'debt:delete:debt-1',
  );
  assert.equal(buttons.find((button) => button.text === '❌ Đóng')?.callback_data, 'debt:close');
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
