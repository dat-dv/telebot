import assert from 'node:assert/strict';
import test from 'node:test';
import { parseReceiptImageAnalysis } from './gemini.service';

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
