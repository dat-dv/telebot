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

void test('complete-task callback queues confirmation without completing the task', async () => {
  const queued: Array<{ name: string; payload: Record<string, unknown>; userId: number }> = [];
  const replies: string[] = [];
  const callbackAnswers: string[] = [];
  const gemini = {
    queueToolConfirmation: (name: string, payload: Record<string, unknown>, userId: number) => {
      queued.push({ name, payload, userId });
      return { id: 'action-1', referenceId: 'REQ-001', name, payload };
    },
  };
  const ui = {
    formatConfirmationBox: () => 'Xác nhận hoàn tất task',
    buildConfirmationMarkup: () => ({ reply_markup: {} }),
  };
  const tasks = {
    listTasks: () => Promise.reject(new Error('Task must not be completed before confirmation.')),
  };
  const update = new TelegramUpdate(
    gemini as never,
    {} as never,
    {} as never,
    {} as never,
    tasks as never,
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
  const ctx = {
    from: { id: 7 },
    match: ['complete_task:task-1', 'task-1'],
    answerCbQuery: (message: string) => Promise.resolve(callbackAnswers.push(message)),
    reply: (message: string) => Promise.resolve(replies.push(message)),
  };

  await update.onCompleteTaskAction(ctx as never);

  assert.deepEqual(queued, [{ name: 'complete_task', payload: { taskId: 'task-1' }, userId: 7 }]);
  assert.deepEqual(callbackAnswers, ['Hãy xác nhận payload trước khi hoàn tất.']);
  assert.deepEqual(replies, ['Xác nhận hoàn tất task']);
});
