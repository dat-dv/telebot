import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceService } from '../../finance/finance.service';
import { ResolveFinancePlaceTool } from './resolve-finance-place.tool';

void test('ResolveFinancePlaceTool returns matching places when found', async () => {
  const financeService = {
    resolvePlaces: (userId: number, name: string) => {
      assert.equal(userId, 42);
      assert.equal(name, 'The Coffee House');
      return Promise.resolve([
        {
          id: 'place-123',
          userId: '42',
          name: 'The Coffee House',
          normalizedName: 'the coffee house',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    },
  } as unknown as FinanceService;

  const tool = new ResolveFinancePlaceTool(financeService);
  const result = await tool.execute({ name: 'The Coffee House' }, { userId: 42 });

  assert.equal(result.success, true);
  assert.equal(result.count, 1);
  assert.deepEqual(result.places, [{ placeId: 'place-123', name: 'The Coffee House' }]);
});

void test('ResolveFinancePlaceTool returns empty array when no place found', async () => {
  const financeService = {
    resolvePlaces: (userId: number, name: string) => {
      assert.equal(userId, 42);
      assert.equal(name, 'Quán Mới');
      return Promise.resolve([]);
    },
  } as unknown as FinanceService;

  const tool = new ResolveFinancePlaceTool(financeService);
  const result = await tool.execute({ name: 'Quán Mới' }, { userId: 42 });

  assert.equal(result.success, true);
  assert.equal(result.count, 0);
  assert.deepEqual(result.places, []);
});
