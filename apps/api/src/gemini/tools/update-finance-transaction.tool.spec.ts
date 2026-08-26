import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceService } from '../../finance/finance.service';
import { UpdateFinanceTransactionTool } from './update-finance-transaction.tool';

void test('UpdateFinanceTransactionTool updates the most recent transaction when no ID is given', async () => {
  let updatedInput: unknown = null;
  const mockTransaction = {
    id: 'tx-recent-123',
    userId: '42',
    type: 'expense',
    amount: 20000,
    category: 'Ăn uống',
    note: 'Bánh mì sandwich',
    occurredAt: new Date('2026-08-24T11:29:00+07:00'),
  };

  const financeService = {
    getLatestTransaction: (userId: number) => {
      assert.equal(userId, 42);
      return Promise.resolve(mockTransaction);
    },
    updateTransaction: (userId: number, id: string, input: unknown) => {
      assert.equal(userId, 42);
      assert.equal(id, 'tx-recent-123');
      updatedInput = input;
      return Promise.resolve({
        ...mockTransaction,
        occurredAt: new Date('2026-08-24T09:00:00+07:00'),
      });
    },
    formatMoney: (val: number) => `${val.toLocaleString('vi-VN')}đ`,
  } as unknown as FinanceService;

  const tool = new UpdateFinanceTransactionTool(financeService);
  const result = await tool.execute(
    {
      occurredAt: '2026-08-24T09:00:00+07:00',
    },
    { userId: 42 },
  );

  assert.equal(result.success, true);
  assert.deepEqual(updatedInput, { occurredAt: '2026-08-24T09:00:00+07:00' });
  const tx = result.transaction as Record<string, unknown>;
  assert.equal(tx.id, 'tx-recent-123');
  assert.equal(tx.amountText, '20.000đ');
});

void test('UpdateFinanceTransactionTool returns error when no recent transaction found', async () => {
  const financeService = {
    getLatestTransaction: () => Promise.resolve(null),
  } as unknown as FinanceService;

  const tool = new UpdateFinanceTransactionTool(financeService);
  const result = await tool.execute(
    {
      occurredAt: '2026-08-24T09:00:00+07:00',
    },
    { userId: 42 },
  );

  assert.equal(result.success, false);
  assert.equal(result.error, 'Không tìm thấy giao dịch thu–chi gần đây để cập nhật.');
});

void test('UpdateFinanceTransactionTool passes placeId and placeName correctly', async () => {
  let updatedInput: unknown = null;
  const mockTransaction = {
    id: 'tx-488d99b3',
    userId: '42',
    type: 'expense',
    amount: 98000,
    category: 'Ăn uống',
    note: '1 ly cà phê',
    occurredAt: new Date('2026-08-25T12:33:00+07:00'),
  };

  const financeService = {
    getTransaction: (userId: number, id: string) => {
      assert.equal(userId, 42);
      assert.equal(id, 'tx-488d99b3');
      return Promise.resolve(mockTransaction);
    },
    updateTransaction: (userId: number, id: string, input: unknown) => {
      assert.equal(userId, 42);
      assert.equal(id, 'tx-488d99b3');
      updatedInput = input;
      return Promise.resolve({
        ...mockTransaction,
        placeId: 'place-tch',
        place: { name: 'The Coffee House Tô Hiệu' },
      });
    },
    formatMoney: (val: number) => `${val.toLocaleString('vi-VN')}đ`,
  } as unknown as FinanceService;

  const tool = new UpdateFinanceTransactionTool(financeService);
  const result = await tool.execute(
    {
      transactionId: 'tx-488d99b3',
      createNewPlace: true,
      placeName: 'The Coffee House Tô Hiệu',
    },
    { userId: 42 },
  );

  assert.equal(result.success, true);
  assert.deepEqual(updatedInput, {
    createNewPlace: true,
    placeName: 'The Coffee House Tô Hiệu',
  });
  const tx = result.transaction as Record<string, unknown>;
  assert.equal(tx.id, 'tx-488d99b3');
  assert.equal(tx.placeName, 'The Coffee House Tô Hiệu');
});
