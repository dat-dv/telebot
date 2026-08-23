import assert from 'node:assert/strict';
import test from 'node:test';
import { TelegramUpdate } from './telegram.update';

void test('/week attaches week-scoped actions', async () => {
  const sent: Array<{ text: string; markup: unknown }> = [];
  const weekMarkup = { action: 'week' };
  const ui = {
    withTyping: async <T>(_ctx: unknown, action: () => Promise<T>) => action(),
    buildWeekActionsMarkup: () => weekMarkup,
    sendSafeReply: async (_ctx: unknown, text: string, markup: unknown) => {
      sent.push({ text, markup });
      await Promise.resolve();
    },
  };
  const gemini = {
    getWeekSummary: async () => {
      await Promise.resolve();
      return 'Tổng hợp 7 ngày';
    },
  };
  const update = new TelegramUpdate(
    gemini as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    ui as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  await update.onWeek({ from: { id: 1 }, botInfo: { username: 'bot' } } as never);

  assert.deepEqual(sent, [{ text: 'Tổng hợp 7 ngày', markup: weekMarkup }]);
});
