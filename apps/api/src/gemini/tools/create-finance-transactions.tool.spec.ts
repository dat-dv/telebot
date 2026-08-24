import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceService } from '../../finance/finance.service';
import { CreateFinanceTransactionsTool } from './create-finance-transactions.tool';

void test('CreateFinanceTransactionsTool creates valid transactions and calculates total', async () => {
  const createdNotes: string[] = [];
  const financeService = {
    createTransaction: ({ note, amount, type }: { note: string; amount: number; type: string }) => {
      if (note === 'Nước cam lỗi') throw new Error('Database error');
      createdNotes.push(note);
      return Promise.resolve({
        id: `tx-${note}`,
        type,
        amount,
        category: 'Ăn uống',
        note,
        occurredAt: new Date('2026-08-23T10:00:00.000Z'),
      });
    },
    formatMoney: (val: number) => `${val.toLocaleString('vi-VN')}đ`,
  } as unknown as FinanceService;

  const tool = new CreateFinanceTransactionsTool(financeService);

  const result = await tool.execute(
    {
      transactions: [
        { type: 'expense', amount: 35000, note: 'Ly cà phê', category: 'Ăn uống' },
        { type: 'expense', amount: 40000, note: 'Nước cam lỗi', category: 'Ăn uống' },
        { type: 'expense', amount: 20000, note: 'Bánh mì', category: 'Ăn uống' },
      ],
    },
    { userId: 42 },
  );

  assert.deepEqual(createdNotes, ['Ly cà phê', 'Bánh mì']);
  assert.equal(result.success, false);
  assert.equal(result.totalAmount, 55000);
  assert.equal(result.created.length, 2);
  assert.deepEqual(result.failed, [
    { note: 'Nước cam lỗi', amount: 40000, error: 'Database error' },
  ]);
});

void test('CreateFinanceTransactionsTool succeeds when all items are valid', async () => {
  const financeService = {
    createTransaction: ({ note, amount, type }: { note: string; amount: number; type: string }) => {
      return Promise.resolve({
        id: `tx-${note}`,
        type,
        amount,
        category: 'Ăn uống',
        note,
        occurredAt: new Date('2026-08-23T10:00:00.000Z'),
      });
    },
    formatMoney: (val: number) => `${val.toLocaleString('vi-VN')}đ`,
  } as unknown as FinanceService;

  const tool = new CreateFinanceTransactionsTool(financeService);

  const result = await tool.execute(
    {
      transactions: [
        { type: 'expense', amount: 35000, note: 'Ly cà phê', category: 'Ăn uống' },
        { type: 'expense', amount: 40000, note: 'Ly nước cam', category: 'Ăn uống' },
      ],
    },
    { userId: 42 },
  );

  assert.equal(result.success, true);
  assert.equal(result.totalAmount, 75000);
  assert.equal(result.created.length, 2);
  assert.equal(result.failed.length, 0);
});

void test('CreateFinanceTransactionsTool rejects an empty transactions list', async () => {
  const tool = new CreateFinanceTransactionsTool({} as FinanceService);
  const result = await tool.execute({ transactions: [] }, { userId: 42 });

  assert.equal(result.success, false);
  assert.equal(result.message, 'Danh sách giao dịch phải có từ 1 đến 20 mục.');
});
