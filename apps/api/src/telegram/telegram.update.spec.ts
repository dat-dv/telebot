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

void test('onTextMessage auto-cancels pending actions and edits the previous message', async () => {
  const cancelledActions: number[] = [];
  const editedMessages: Array<{ chatId: unknown; messageId: unknown; text: string }> = [];
  const gemini = {
    cancelPendingActionsForUser: (userId: number) => {
      cancelledActions.push(userId);
      return [
        {
          id: 'action-old',
          referenceId: 'REQ-OLD',
          userId,
          name: 'create_finance_transaction',
          payload: { amount: 64000 },
          expiresAt: Date.now() + 60000,
          chatId: 12345,
          messageId: 999,
        },
      ];
    },
    chat: () => Promise.resolve({ text: 'Đã nhận yêu cầu mới' }),
  };
  const voice = {
    cancelPendingVoiceRequestsForUser: () => [],
  };
  const ui = {
    withTyping: async <T>(_ctx: unknown, action: () => Promise<T>) => action(),
    formatResultBox: (_name: string, _res: unknown, _ref: string, cancelled: boolean) =>
      cancelled ? '❌ Đã hủy thao tác.' : '',
    formatCancelledBox: () => '❌ Đã hủy thao tác.',
    formatConfirmedBox: () => '✅ Đã xác nhận & thực hiện thành công.',
    buildNotificationActionsMarkup: () => ({ reply_markup: {} }),
    sendSafeReply: () => Promise.resolve(),
  };
  const history = {
    getHistory: () => [],
    appendUserMessage: () => {},
    appendModelMessage: () => {},
  };
  const googleAuth = {
    isAuthorized: () => true,
  };
  const update = new TelegramUpdate(
    gemini as never,
    history as never,
    {} as never,
    googleAuth as never,
    {} as never,
    {} as never,
    {} as never,
    ui as never,
    voice as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const ctx = {
    from: { id: 7 },
    message: { text: 'vào lúc 3h' },
    telegram: {
      editMessageText: (chatId: unknown, messageId: unknown, _inline: unknown, text: string) => {
        editedMessages.push({ chatId, messageId, text });
        return Promise.resolve();
      },
    },
  };

  await update.onTextMessage(ctx as never);

  assert.deepEqual(cancelledActions, [7]);
  assert.equal(editedMessages.length, 1);
  assert.equal(editedMessages[0].chatId, 12345);
  assert.equal(editedMessages[0].messageId, 999);
  assert.equal(editedMessages[0].text, '❌ Đã hủy thao tác.');
});
