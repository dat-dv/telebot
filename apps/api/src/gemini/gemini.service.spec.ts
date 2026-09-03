import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReceiptAnalysisPrompt, parseReceiptImageAnalysis } from './gemini.service';

void test('includes Vietnam time context in the direct OCR JSON prompt', () => {
  const prompt = buildReceiptAnalysisPrompt('Thanh toán hôm nay', {
    nowText: 'Hôm nay là: Thứ Hai, ngày 25/08/2026 lúc 09:30:00 (Múi giờ Asia/Ho_Chi_Minh)',
    nowIso: '2026-08-25T09:30:00+07:00',
  });

  assert.match(prompt, /Asia\/Ho_Chi_Minh/);
  assert.match(prompt, /2026-08-25T09:30:00\+07:00/);
  assert.match(prompt, /Thanh toán hôm nay/);
});

void test('parses a complete receipt into a confirmation-ready transaction', () => {
  const result = parseReceiptImageAnalysis(
    JSON.stringify({
      kind: 'ready',
      type: 'expense',
      amount: 65000,
      category: 'Ăn uống',
      note: 'Cơm trưa',
      summary: 'Hoá đơn cơm trưa 65.000đ.',
    }),
  );

  assert.deepEqual(result, {
    kind: 'ready',
    type: 'expense',
    amount: 65000,
    category: 'Ăn uống',
    note: 'Cơm trưa',
    occurredAt: undefined,
    summary: 'Hoá đơn cơm trưa 65.000đ.',
  });
});

void test('does not create a transaction from an incomplete image analysis', () => {
  const result = parseReceiptImageAnalysis(
    JSON.stringify({
      kind: 'missing_fields',
      missingFields: ['amount'],
      summary: 'Chỉ đọc được tên cửa hàng.',
    }),
  );

  assert.deepEqual(result, {
    kind: 'missing_fields',
    missingFields: ['amount'],
    summary: 'Chỉ đọc được tên cửa hàng.',
  });
});

void test('GeminiService queues, attaches message, and cancels pending actions for user', async () => {
  const { GeminiService } = await import('./gemini.service');
  const dummyTool = {
    name: 'create_finance_transaction',
    declaration: { name: 'create_finance_transaction' },
    execute: () => Promise.resolve({}),
  };
  const config = {
    getOrThrow: (key: string) => {
      if (key === 'gemini.apiKey') return 'fake-key';
      if (key === 'gemini.model') return 'gemini-1.5-flash';
      if (key === 'timezone') return 'Asia/Ho_Chi_Minh';
      return '';
    },
  };
  const service = new GeminiService(
    config as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    {} as never,
  );

  const action1 = service.queueToolConfirmation(
    'create_finance_transaction',
    { amount: 64000 },
    100,
  );
  service.attachMessageToPendingAction(action1.id, 999, 12345);

  const action2 = service.queueToolConfirmation(
    'create_finance_transaction',
    { amount: 30000 },
    200,
  );

  const cancelledUser100 = service.cancelPendingActionsForUser(100);
  assert.equal(cancelledUser100.length, 1);
  assert.equal(cancelledUser100[0].id, action1.id);
  assert.equal(cancelledUser100[0].chatId, 999);
  assert.equal(cancelledUser100[0].messageId, 12345);

  // User 200 action should still be pending
  const cancelledUser200 = service.cancelPendingActionsForUser(200);
  assert.equal(cancelledUser200.length, 1);
  assert.equal(cancelledUser200[0].id, action2.id);
});

void test('GeminiService.coalesceFunctionCalls merges multiple create_finance_transaction calls into create_finance_transactions', async () => {
  const { GeminiService } = await import('./gemini.service');
  const dummyTool = {
    name: 'dummy',
    declaration: { name: 'dummy' },
    execute: () => Promise.resolve({}),
  };
  const config = {
    getOrThrow: () => 'val',
  };
  const service = new GeminiService(
    config as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    {} as never,
  );

  const parallelCalls = [
    {
      name: 'create_finance_transaction',
      args: { note: 'Ăn sáng', amount: 30000, type: 'expense' },
    },
    {
      name: 'create_finance_transaction',
      args: { note: 'Ăn trưa', amount: 50000, type: 'expense' },
    },
    {
      name: 'create_finance_transaction',
      args: { note: 'Ăn tối', amount: 70000, type: 'expense' },
    },
  ];

  const coalesced = service.coalesceFunctionCalls(parallelCalls);
  assert.equal(coalesced?.length, 1);
  assert.equal(coalesced?.[0].name, 'create_finance_transactions');
  const txArgs = coalesced?.[0].args as { transactions: Array<Record<string, unknown>> };
  assert.equal(txArgs.transactions.length, 3);
  assert.equal(txArgs.transactions[0].note, 'Ăn sáng');
  assert.equal(txArgs.transactions[0].amount, 30000);
  assert.equal(txArgs.transactions[1].note, 'Ăn trưa');
  assert.equal(txArgs.transactions[1].amount, 50000);
  assert.equal(txArgs.transactions[2].note, 'Ăn tối');
  assert.equal(txArgs.transactions[2].amount, 70000);
});

void test('GeminiService.coalesceFunctionCalls merges multiple create_task calls into create_tasks', async () => {
  const { GeminiService } = await import('./gemini.service');
  const dummyTool = {
    name: 'dummy',
    declaration: { name: 'dummy' },
    execute: () => Promise.resolve({}),
  };
  const config = {
    getOrThrow: () => 'val',
  };
  const service = new GeminiService(
    config as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    {} as never,
  );

  const parallelTaskCalls = [
    {
      name: 'create_task',
      args: { title: 'Mua rau' },
    },
    {
      name: 'create_task',
      args: { title: 'Quét nhà' },
    },
  ];

  const coalesced = service.coalesceFunctionCalls(parallelTaskCalls);
  assert.equal(coalesced?.length, 1);
  assert.equal(coalesced?.[0].name, 'create_tasks');
  const taskArgs = coalesced?.[0].args as { tasks: Array<Record<string, unknown>> };
  assert.equal(taskArgs.tasks.length, 2);
  assert.equal(taskArgs.tasks[0].title, 'Mua rau');
  assert.equal(taskArgs.tasks[1].title, 'Quét nhà');
});

void test('GeminiService.coalesceFunctionCalls preserves single tool call unchanged', async () => {
  const { GeminiService } = await import('./gemini.service');
  const dummyTool = {
    name: 'dummy',
    declaration: { name: 'dummy' },
    execute: () => Promise.resolve({}),
  };
  const config = {
    getOrThrow: () => 'val',
  };
  const service = new GeminiService(
    config as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    dummyTool as never,
    {} as never,
  );

  const singleCall = [
    {
      name: 'create_finance_transaction',
      args: { note: 'Ăn sáng', amount: 30000, type: 'expense' },
    },
  ];

  const coalesced = service.coalesceFunctionCalls(singleCall);
  assert.deepEqual(coalesced, singleCall);
});
