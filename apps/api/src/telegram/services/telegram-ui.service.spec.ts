import assert from 'node:assert/strict';
import test from 'node:test';
import { TelegramUiService } from './telegram-ui.service';

void test('buildMainMenuInlineMarkup opens Dashboard through its direct URL', () => {
  const menu = new TelegramUiService().buildMainMenuInlineMarkup(
    false,
    true,
    '',
    'https://telebot.example/api/access?token=one-time-token',
  );
  const reportButton = menu.reply_markup.inline_keyboard
    .flat()
    .find((button) => button.text === '📊 Xem báo cáo');

  assert.equal(reportButton?.text, '📊 Xem báo cáo');
  assert.equal(reportButton?.url, 'https://telebot.example/api/access?token=one-time-token');
  assert.equal('callback_data' in (reportButton ?? {}), false);
});

void test('buildMainMenuInlineMarkup has the same menu for start and help inputs', () => {
  const service = new TelegramUiService();
  const startMenu = service.buildMainMenuInlineMarkup(
    true,
    true,
    '',
    'https://telebot.example/api/access?token=one-time-token',
  );
  const helpMenu = service.buildMainMenuInlineMarkup(
    true,
    true,
    '',
    'https://telebot.example/api/access?token=one-time-token',
  );

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
