import assert from 'node:assert/strict';
import test from 'node:test';
import { DebtEntity } from '../database/entities/debt.entity';
import { DebtPaymentEntity } from '../database/entities/debt-payment.entity';
import { FinanceTransactionEntity } from '../database/entities/finance-transaction.entity';
import { FinancePlaceEntity } from '../database/entities/finance-place.entity';
import { FinanceService } from './finance.service';

function createFinanceService(debt: Partial<DebtEntity>) {
  const savedTransactions: Partial<FinanceTransactionEntity>[] = [];
  const savedPayments: Partial<DebtPaymentEntity>[] = [];
  const debtRepository = {
    findOne: () => Promise.resolve(debt),
    save: (value: Partial<DebtEntity>) => Promise.resolve(value),
  };
  const debtPaymentRepository = {
    create: (value: Partial<DebtPaymentEntity>) => ({ id: 'payment-1', ...value }),
    save: (value: Partial<DebtPaymentEntity>) => {
      savedPayments.push(value);
      return Promise.resolve(value);
    },
  };
  const transactionRepository = {
    create: (value: Partial<FinanceTransactionEntity>) => value,
    save: (value: Partial<FinanceTransactionEntity>) => {
      savedTransactions.push(value);
      return Promise.resolve(value);
    },
  };
  const manager = {
    getRepository: (entity: unknown) => {
      if (entity === DebtEntity) return debtRepository;
      if (entity === DebtPaymentEntity) return debtPaymentRepository;
      return transactionRepository;
    },
  };
  const service = new FinanceService(
    {
      manager: {
        transaction: (callback: (value: typeof manager) => unknown) =>
          Promise.resolve(callback(manager)),
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, savedPayments, savedTransactions };
}

void test('recordDebtPayment records an income when recovering a receivable', async () => {
  const debt = {
    id: 'debt-1',
    userId: '42',
    direction: 'receivable' as const,
    counterparty: 'Nam',
    contactId: 'contact-1',
    remainingAmount: 500_000,
    currency: 'VND',
    status: 'active' as const,
  };
  const { service, savedPayments, savedTransactions } = createFinanceService(debt);

  await service.recordDebtPayment(42, debt.id, 200_000, '2026-08-24T10:00:00.000Z', 'Chuyển khoản');

  assert.equal(debt.remainingAmount, 300_000);
  assert.equal(savedPayments.length, 1);
  assert.deepEqual(savedTransactions, [
    {
      userId: '42',
      type: 'income',
      amount: 200_000,
      currency: 'VND',
      category: 'Thu hồi nợ',
      contactId: 'contact-1',
      note: 'Thu hồi nợ từ Nam: Chuyển khoản',
      occurredAt: new Date('2026-08-24T10:00:00.000Z'),
    },
  ]);
});

void test('recordDebtPayment records an expense when paying a payable debt', async () => {
  const debt = {
    id: 'debt-2',
    userId: '42',
    direction: 'payable' as const,
    counterparty: 'Lan',
    remainingAmount: 200_000,
    currency: 'VND',
    status: 'active' as const,
  };
  const { service, savedTransactions } = createFinanceService(debt);

  await service.recordDebtPayment(42, debt.id, 200_000);

  assert.equal(debt.remainingAmount, 0);
  assert.equal(debt.status, 'settled');
  assert.deepEqual(savedTransactions[0], {
    userId: '42',
    type: 'expense',
    amount: 200_000,
    currency: 'VND',
    category: 'Trả nợ',
    contactId: undefined,
    note: 'Trả nợ cho Lan',
    occurredAt: savedTransactions[0]?.occurredAt,
  });
});

void test('createTransaction reuses a user-scoped place instead of creating a debt contact', async () => {
  let storedPlace: FinancePlaceEntity | undefined;
  const savedTransactions: Partial<FinanceTransactionEntity>[] = [];
  const service = new FinanceService(
    {
      create: (value: Partial<FinanceTransactionEntity>) => value,
      save: (value: Partial<FinanceTransactionEntity>) => {
        savedTransactions.push(value);
        return Promise.resolve(value);
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      findOne: () => Promise.resolve(storedPlace),
      create: (value: Partial<FinancePlaceEntity>) => value,
      save: (value: Partial<FinancePlaceEntity>) => {
        storedPlace = {
          id: 'place-1',
          userId: '42',
          name: value.name || 'Highlands Coffee',
          normalizedName: value.normalizedName || 'highlands coffee',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return Promise.resolve(storedPlace);
      },
    } as never,
  );

  await service.createTransaction({
    userId: 42,
    type: 'expense',
    amount: 45_000,
    note: 'Cà phê sáng',
    placeName: 'Highlands Coffee',
  });
  await service.createTransaction({
    userId: 42,
    type: 'expense',
    amount: 30_000,
    note: 'Trà đào',
    placeName: 'highlands coffee',
  });

  assert.deepEqual(
    savedTransactions.map((transaction) => transaction.placeId),
    ['place-1', 'place-1'],
  );
  assert.equal(savedTransactions[0]?.contactId, undefined);
});

void test('FinanceService.resolvePlaces finds places matching normalized name', async () => {
  const mockPlaces: FinancePlaceEntity[] = [
    {
      id: 'place-tch',
      userId: '42',
      name: 'The Coffee House Tô Hiệu',
      normalizedName: 'the coffee house to hieu',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const service = new FinanceService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      find: (opts: { where: { userId: string; normalizedName: string } }) => {
        assert.equal(opts.where.userId, '42');
        assert.equal(opts.where.normalizedName, 'the coffee house to hieu');
        return Promise.resolve(mockPlaces);
      },
    } as never,
  );

  const found = await service.resolvePlaces(42, 'The Coffee House Tô Hiệu');
  assert.equal(found.length, 1);
  assert.equal(found[0]?.id, 'place-tch');
  assert.equal(found[0]?.name, 'The Coffee House Tô Hiệu');

  const empty = await service.resolvePlaces(42, '   ');
  assert.equal(empty.length, 0);
});
