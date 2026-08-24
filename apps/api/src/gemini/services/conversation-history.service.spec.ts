import assert from 'node:assert/strict';
import test from 'node:test';
import { ConversationHistoryService } from './conversation-history.service';

void test('ConversationHistoryService manages short-term message history per user', () => {
  const service = new ConversationHistoryService();
  const userId = 12345;

  assert.deepEqual(service.getHistory(userId), []);

  service.appendUserMessage(userId, 'Sáng nay mua 2 bánh mì sandwich ăn sáng 20k');
  service.appendModelMessage(
    userId,
    '✅ Đã ghi sổ thu–chi · Khoản chi 20.000đ (Ăn uống) · Mua 2 bánh mì sandwich ăn sáng',
  );

  const history = service.getHistory(userId);
  assert.equal(history.length, 2);
  assert.deepEqual(history[0], {
    role: 'user',
    parts: [{ text: 'Sáng nay mua 2 bánh mì sandwich ăn sáng 20k' }],
  });
  assert.deepEqual(history[1], {
    role: 'model',
    parts: [
      {
        text: '✅ Đã ghi sổ thu–chi · Khoản chi 20.000đ (Ăn uống) · Mua 2 bánh mì sandwich ăn sáng',
      },
    ],
  });
});

void test('ConversationHistoryService respects sliding window maximum', () => {
  const service = new ConversationHistoryService();
  const userId = 999;

  for (let i = 1; i <= 12; i++) {
    service.appendUserMessage(userId, `User message ${i}`);
  }

  const history = service.getHistory(userId);
  assert.equal(history.length, 8);
  assert.deepEqual(history[0], {
    role: 'user',
    parts: [{ text: 'User message 5' }],
  });
  assert.deepEqual(history[7], {
    role: 'user',
    parts: [{ text: 'User message 12' }],
  });
});

void test('ConversationHistoryService clears history', () => {
  const service = new ConversationHistoryService();
  const userId = 888;

  service.appendUserMessage(userId, 'Hello');
  assert.equal(service.getHistory(userId).length, 1);

  service.clearHistory(userId);
  assert.equal(service.getHistory(userId).length, 0);
});
