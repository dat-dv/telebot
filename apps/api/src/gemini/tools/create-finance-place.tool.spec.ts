import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceService } from '../../finance/finance.service';
import { CreateFinancePlaceTool } from './create-finance-place.tool';

void test('CreateFinancePlaceTool creates place successfully', async () => {
  const financeService = {
    createPlace: (userId: number, name: string) => {
      assert.equal(userId, 42);
      assert.equal(name, 'The Coffee House');
      return Promise.resolve({
        id: 'place-new-123',
        userId: '42',
        name: 'The Coffee House',
        normalizedName: 'the coffee house',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
  } as unknown as FinanceService;

  const tool = new CreateFinancePlaceTool(financeService);
  const result = await tool.execute({ name: 'The Coffee House' }, { userId: 42 });

  assert.equal(result.success, true);
  assert.deepEqual(result.place, {
    id: 'place-new-123',
    name: 'The Coffee House',
  });
});

void test('CreateFinancePlaceTool returns error for empty name', async () => {
  const financeService = {} as unknown as FinanceService;
  const tool = new CreateFinancePlaceTool(financeService);
  const result = await tool.execute({ name: '   ' }, { userId: 42 });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Tên nơi chốn không được để trống.');
});
