import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceService } from '../../finance/finance.service';
import { CreateDebtContactTool } from './create-debt-contact.tool';

void test('CreateDebtContactTool creates contact successfully with all fields', async () => {
  const financeService = {
    createContact: (
      userId: number,
      name: string,
      alias?: string,
      descriptor?: string,
      phoneNumber?: string,
      bankAccountNumber?: string,
      bankCode?: string,
      bankName?: string,
    ) => {
      assert.equal(userId, 42);
      assert.equal(name, 'Đức CMC');
      assert.equal(alias, 'Đức');
      assert.equal(descriptor, 'số 90 Quảng Hiền, Bảy Hiền, Hồ Chí Minh');
      assert.equal(phoneNumber, '0901234567');
      assert.equal(bankAccountNumber, '123456789');
      assert.equal(bankCode, 'VCB');
      assert.equal(bankName, 'Vietcombank');
      return Promise.resolve({
        id: 'contact-uuid-1',
        userId: '42',
        displayName: name,
        alias,
        descriptor,
        phoneNumber,
        bankAccountNumber,
        bankCode,
        bankName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
  } as unknown as FinanceService;

  const tool = new CreateDebtContactTool(financeService);
  const result = await tool.execute(
    {
      name: 'Đức CMC',
      alias: 'Đức',
      descriptor: 'số 90 Quảng Hiền, Bảy Hiền, Hồ Chí Minh',
      phoneNumber: '0901234567',
      bankAccountNumber: '123456789',
      bankCode: 'VCB',
      bankName: 'Vietcombank',
    },
    { userId: 42 },
  );

  assert.equal(result.success, true);
  assert.deepEqual(result.contact, {
    id: 'contact-uuid-1',
    name: 'Đức CMC',
    alias: 'Đức',
    descriptor: 'số 90 Quảng Hiền, Bảy Hiền, Hồ Chí Minh',
    phoneNumber: '0901234567',
  });
});

void test('CreateDebtContactTool creates contact with only name (respecting no alias splitting)', async () => {
  const financeService = {
    createContact: (userId: number, name: string) => {
      assert.equal(userId, 42);
      assert.equal(name, 'Đức CMC');
      return Promise.resolve({
        id: 'contact-uuid-2',
        userId: '42',
        displayName: 'Đức CMC',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
  } as unknown as FinanceService;

  const tool = new CreateDebtContactTool(financeService);
  const result = await tool.execute({ name: 'Đức CMC' }, { userId: 42 });

  assert.equal(result.success, true);
  assert.deepEqual(result.contact, {
    id: 'contact-uuid-2',
    name: 'Đức CMC',
    alias: undefined,
    descriptor: undefined,
    phoneNumber: undefined,
  });
});

void test('CreateDebtContactTool returns error for empty name', async () => {
  const financeService = {} as unknown as FinanceService;
  const tool = new CreateDebtContactTool(financeService);
  const result = await tool.execute({ name: '   ' }, { userId: 42 });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Tên người liên quan không được để trống.');
});
