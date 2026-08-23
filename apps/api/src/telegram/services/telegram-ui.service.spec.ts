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
