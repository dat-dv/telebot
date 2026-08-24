import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../database/entities/finance-transaction.entity';
import { DebtEntity } from '../database/entities/debt.entity';
import { DebtContactEntity } from '../database/entities/debt-contact.entity';
import { DebtPaymentEntity } from '../database/entities/debt-payment.entity';

export interface CreateFinanceTransactionDto {
  userId: number;
  type: 'income' | 'expense';
  amount: number;
  currency?: string;
  category?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  note: string;
  occurredAt?: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  transactions: FinanceTransactionEntity[];
}

export interface CreateDebtDto {
  userId: number;
  direction: 'receivable' | 'payable';
  counterparty: string;
  counterpartyAlias?: string;
  contactId?: string;
  createNewContact?: boolean;
  amount: number;
  currency?: string;
  note?: string;
  dueAt?: string;
}

export interface UpdateTransactionDto {
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  category?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  note?: string;
  occurredAt?: string;
}

export interface UpdateDebtDto {
  direction?: 'receivable' | 'payable';
  amount?: number;
  currency?: string;
  note?: string;
  dueAt?: string;
}

export interface CombineContactsDto {
  targetContactId: string;
  sourceContactIds: string[];
  displayName?: string;
  alias?: string;
  descriptor?: string;
}

export interface CombineContactsResult {
  targetContact: DebtContactEntity;
  affectedDebtsCount: number;
  mergedCount: number;
}

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepo: Repository<FinanceTransactionEntity>,
    @InjectRepository(DebtEntity)
    private readonly debtRepo: Repository<DebtEntity>,
    @InjectRepository(DebtContactEntity)
    private readonly contactRepo: Repository<DebtContactEntity>,
    @InjectRepository(DebtPaymentEntity)
    private readonly debtPaymentRepo: Repository<DebtPaymentEntity>,
  ) {}

  public async createTransaction(
    dto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionEntity> {
    const amount = Math.round(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Số tiền phải lớn hơn 0.');
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error('Ngày phát sinh không hợp lệ.');
    }

    const note = dto.note?.trim();
    if (!note) {
      throw new Error('Cần có nội dung cho khoản thu hoặc chi.');
    }

    const transaction = this.transactionRepo.create({
      userId: dto.userId.toString(),
      type: dto.type,
      amount,
      currency: dto.currency?.trim() || 'VND',
      category: dto.category?.trim() || 'Khác',
      paymentMethod: dto.paymentMethod?.trim() || undefined,
      receiptUrl: dto.receiptUrl?.trim() || undefined,
      contactId: dto.contactId || undefined,
      note,
      occurredAt,
    });
    return this.transactionRepo.save(transaction);
  }

  public async getSummary(
    userId: number,
    startAt?: string,
    endAt?: string,
  ): Promise<FinanceSummary> {
    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId: userId.toString() });

    if (startAt) {
      const startDate = new Date(startAt);
      if (Number.isNaN(startDate.getTime())) throw new Error('Mốc thời gian bắt đầu không hợp lệ.');
      query.andWhere('transaction.occurred_at >= :startAt', { startAt: startDate });
    }
    if (endAt) {
      const endDate = new Date(endAt);
      if (Number.isNaN(endDate.getTime())) throw new Error('Mốc thời gian kết thúc không hợp lệ.');
      query.andWhere('transaction.occurred_at <= :endAt', { endAt: endDate });
    }

    const transactions = await query.orderBy('transaction.occurred_at', 'DESC').getMany();
    const income = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);

    return { income, expense, balance: income - expense, transactions };
  }

  public async listTransactions(
    userId: number,
    type?: 'income' | 'expense',
  ): Promise<FinanceTransactionEntity[]> {
    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId: userId.toString() });
    if (type) query.andWhere('transaction.type = :type', { type });
    return query.orderBy('transaction.occurred_at', 'DESC').take(200).getMany();
  }

  public getTransaction(userId: number, id: string): Promise<FinanceTransactionEntity | null> {
    return this.transactionRepo.findOne({ where: { id, userId: userId.toString() } });
  }

  public async updateTransaction(
    userId: number,
    id: string,
    input: UpdateTransactionDto,
  ): Promise<FinanceTransactionEntity | null> {
    const transaction = await this.getTransaction(userId, id);
    if (!transaction) return null;
    if (input.type) transaction.type = input.type;
    if (input.amount !== undefined) {
      const amount = Math.round(Number(input.amount));
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Số tiền phải lớn hơn 0.');
      transaction.amount = amount;
    }
    if (input.currency !== undefined) transaction.currency = input.currency.trim() || 'VND';
    if (input.category !== undefined) transaction.category = input.category.trim() || 'Khác';
    if (input.paymentMethod !== undefined)
      transaction.paymentMethod = input.paymentMethod.trim() || undefined;
    if (input.receiptUrl !== undefined)
      transaction.receiptUrl = input.receiptUrl.trim() || undefined;
    if (input.contactId !== undefined) transaction.contactId = input.contactId || undefined;
    if (input.note !== undefined) {
      if (!input.note.trim()) throw new Error('Cần có nội dung cho khoản thu hoặc chi.');
      transaction.note = input.note.trim();
    }
    if (input.occurredAt !== undefined) {
      const occurredAt = new Date(input.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) throw new Error('Ngày phát sinh không hợp lệ.');
      transaction.occurredAt = occurredAt;
    }
    return this.transactionRepo.save(transaction);
  }

  public async deleteTransaction(userId: number, id: string): Promise<boolean> {
    const transaction = await this.getTransaction(userId, id);
    if (!transaction) return false;
    await this.transactionRepo.remove(transaction);
    return true;
  }

  public getTodayRange(): { startAt: string; endAt: string } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    const date = `${value('year')}-${value('month')}-${value('day')}`;
    return {
      startAt: `${date}T00:00:00+07:00`,
      endAt: `${date}T23:59:59.999+07:00`,
    };
  }

  public async createDebt(dto: CreateDebtDto): Promise<DebtEntity> {
    const amount = Math.round(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Số tiền phải lớn hơn 0.');
    let contact: DebtContactEntity | null = null;
    if (dto.contactId) {
      contact = await this.contactRepo.findOne({
        where: { id: dto.contactId, userId: dto.userId.toString() },
      });
      if (!contact) throw new Error('Không tìm thấy người liên quan đã chọn.');
    } else if (dto.createNewContact) {
      contact = await this.createContact(dto.userId, dto.counterparty, dto.counterpartyAlias);
    } else {
      throw new Error('Cần chọn người trong danh bạ hoặc xác nhận tạo người mới.');
    }
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
    if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error('Ngày hẹn trả không hợp lệ.');

    return this.debtRepo.save(
      this.debtRepo.create({
        userId: dto.userId.toString(),
        direction: dto.direction,
        contactId: contact.id,
        counterparty: contact.displayName,
        counterpartyAlias: contact.alias,
        originalAmount: amount,
        remainingAmount: amount,
        currency: dto.currency?.trim() || 'VND',
        note: dto.note?.trim() || '',
        dueAt,
        status: 'active',
      }),
    );
  }

  public async resolveContacts(
    userId: number,
    name: string,
    alias?: string,
  ): Promise<DebtContactEntity[]> {
    const normalizedName = this.normalizeIdentity(name);
    const normalizedAlias = alias ? this.normalizeIdentity(alias) : undefined;
    if (!normalizedName) return [];
    const query = this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.user_id = :userId', { userId: userId.toString() })
      .andWhere('contact.normalized_name = :normalizedName', { normalizedName });
    if (normalizedAlias) {
      query.andWhere('contact.normalized_alias = :normalizedAlias', { normalizedAlias });
    }
    return query.orderBy('contact.created_at', 'ASC').getMany();
  }

  public async listContacts(userId: number): Promise<DebtContactEntity[]> {
    return this.contactRepo.find({
      where: { userId: userId.toString() },
      order: { displayName: 'ASC', createdAt: 'DESC' },
      take: 200,
    });
  }

  public getContact(userId: number, id: string): Promise<DebtContactEntity | null> {
    return this.contactRepo.findOne({ where: { id, userId: userId.toString() } });
  }

  public async deleteContact(userId: number, id: string): Promise<boolean> {
    const contact = await this.getContact(userId, id);
    if (!contact) return false;
    await this.contactRepo.remove(contact);
    return true;
  }

  public async createContact(
    userId: number,
    name: string,
    alias?: string,
    descriptor?: string,
    phoneNumber?: string,
    bankAccountNumber?: string,
    bankCode?: string,
    bankName?: string,
    avatarUrl?: string,
  ): Promise<DebtContactEntity> {
    const displayName = name?.trim();
    if (!displayName) throw new Error('Cần có tên người liên quan.');
    return this.contactRepo.save(
      this.contactRepo.create({
        userId: userId.toString(),
        displayName,
        alias: alias?.trim() || undefined,
        descriptor: descriptor?.trim() || undefined,
        phoneNumber: phoneNumber?.trim() || undefined,
        bankAccountNumber: bankAccountNumber?.trim() || undefined,
        bankCode: bankCode?.trim() || undefined,
        bankName: bankName?.trim() || undefined,
        avatarUrl: avatarUrl?.trim() || undefined,
        normalizedName: this.normalizeIdentity(displayName),
        normalizedAlias: alias ? this.normalizeIdentity(alias) : undefined,
      }),
    );
  }

  private normalizeIdentity(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('vi-VN')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  public async getActiveDebts(userId: number): Promise<DebtEntity[]> {
    return this.debtRepo
      .createQueryBuilder('debt')
      .leftJoinAndSelect('debt.contact', 'contact')
      .leftJoinAndSelect('debt.payments', 'payments')
      .where('debt.user_id = :userId', { userId: userId.toString() })
      .andWhere('debt.status = :status', { status: 'active' })
      .orderBy('debt.created_at', 'DESC')
      .getMany();
  }

  public async listDebts(userId: number, status?: 'active' | 'settled'): Promise<DebtEntity[]> {
    const query = this.debtRepo
      .createQueryBuilder('debt')
      .leftJoinAndSelect('debt.contact', 'contact')
      .leftJoinAndSelect('debt.payments', 'payments')
      .where('debt.user_id = :userId', { userId: userId.toString() });
    if (status) query.andWhere('debt.status = :status', { status });
    return query.orderBy('debt.created_at', 'DESC').take(200).getMany();
  }

  public getDebt(userId: number, id: string): Promise<DebtEntity | null> {
    return this.debtRepo.findOne({
      where: { id, userId: userId.toString() },
      relations: { contact: true, payments: true },
    });
  }

  public async updateDebt(
    userId: number,
    id: string,
    input: UpdateDebtDto,
  ): Promise<DebtEntity | null> {
    const debt = await this.getDebt(userId, id);
    if (!debt) return null;
    if (input.direction) debt.direction = input.direction;
    if (input.amount !== undefined) {
      const nextOriginalAmount = Math.round(Number(input.amount));
      const paidAmount = debt.originalAmount - debt.remainingAmount;
      if (!Number.isFinite(nextOriginalAmount) || nextOriginalAmount <= 0) {
        throw new Error('Số tiền phải lớn hơn 0.');
      }
      if (nextOriginalAmount < paidAmount) {
        throw new Error('Số tiền mới không được nhỏ hơn phần đã thanh toán.');
      }
      debt.originalAmount = nextOriginalAmount;
      debt.remainingAmount = nextOriginalAmount - paidAmount;
      debt.status = debt.remainingAmount === 0 ? 'settled' : 'active';
      if (debt.status === 'settled' && !debt.settledAt) {
        debt.settledAt = new Date();
      }
    }
    if (input.currency !== undefined) debt.currency = input.currency.trim() || 'VND';
    if (input.note !== undefined) debt.note = input.note.trim();
    if (input.dueAt !== undefined) {
      const dueAt = new Date(input.dueAt);
      if (Number.isNaN(dueAt.getTime())) throw new Error('Ngày hẹn trả không hợp lệ.');
      debt.dueAt = dueAt;
    }
    return this.debtRepo.save(debt);
  }

  public async listExpenses(userId: number): Promise<FinanceTransactionEntity[]> {
    return this.transactionRepo.find({
      where: { userId: userId.toString(), type: 'expense' },
      order: { occurredAt: 'DESC' },
      take: 200,
    });
  }

  public async updateContact(
    userId: number,
    contactId: string,
    name: string,
    alias?: string,
    descriptor?: string,
    phoneNumber?: string,
    bankAccountNumber?: string,
    bankCode?: string,
    bankName?: string,
    avatarUrl?: string,
  ): Promise<DebtContactEntity> {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, userId: userId.toString() },
    });
    if (!contact) throw new Error('Không tìm thấy người trong danh bạ công nợ.');
    const displayName = name?.trim();
    if (!displayName) throw new Error('Tên không được để trống.');
    contact.displayName = displayName;
    contact.alias = alias?.trim() || undefined;
    contact.descriptor = descriptor?.trim() || undefined;
    if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber?.trim() || undefined;
    if (bankAccountNumber !== undefined)
      contact.bankAccountNumber = bankAccountNumber?.trim() || undefined;
    if (bankCode !== undefined) contact.bankCode = bankCode?.trim() || undefined;
    if (bankName !== undefined) contact.bankName = bankName?.trim() || undefined;
    if (avatarUrl !== undefined) contact.avatarUrl = avatarUrl?.trim() || undefined;
    contact.normalizedName = this.normalizeIdentity(displayName);
    contact.normalizedAlias = alias ? this.normalizeIdentity(alias) : undefined;
    return this.contactRepo.save(contact);
  }

  public async combineContacts(
    userId: number,
    input: CombineContactsDto,
  ): Promise<CombineContactsResult> {
    const uid = userId.toString();
    const targetContact = await this.contactRepo.findOne({
      where: { id: input.targetContactId, userId: uid },
    });
    if (!targetContact) {
      throw new Error('Không tìm thấy liên hệ đích để gộp.');
    }

    const uniqueSourceIds = Array.from(
      new Set(input.sourceContactIds.filter((id) => id !== input.targetContactId)),
    );
    if (uniqueSourceIds.length === 0) {
      return { targetContact, affectedDebtsCount: 0, mergedCount: 0 };
    }

    const sourceContacts = await this.contactRepo.find({
      where: { id: In(uniqueSourceIds), userId: uid },
    });

    if (input.displayName?.trim()) {
      targetContact.displayName = input.displayName.trim();
      targetContact.normalizedName = this.normalizeIdentity(targetContact.displayName);
    }
    if (input.alias !== undefined) {
      targetContact.alias = input.alias.trim() || undefined;
      targetContact.normalizedAlias = targetContact.alias
        ? this.normalizeIdentity(targetContact.alias)
        : undefined;
    }
    if (input.descriptor !== undefined) {
      targetContact.descriptor = input.descriptor.trim() || undefined;
    }

    await this.contactRepo.save(targetContact);

    let affectedDebtsCount = 0;
    for (const source of sourceContacts) {
      const debts = await this.debtRepo.find({
        where: { contactId: source.id, userId: uid },
      });
      if (debts.length > 0) {
        for (const debt of debts) {
          debt.contactId = targetContact.id;
          debt.counterparty = targetContact.displayName;
          debt.counterpartyAlias = targetContact.alias;
        }
        await this.debtRepo.save(debts);
        affectedDebtsCount += debts.length;
      }
    }

    if (sourceContacts.length > 0) {
      await this.contactRepo.remove(sourceContacts);
    }

    return {
      targetContact,
      affectedDebtsCount,
      mergedCount: sourceContacts.length,
    };
  }

  public async recordDebtPayment(
    userId: number,
    debtId: string,
    amount: number,
    paymentDate?: string,
    note?: string,
  ): Promise<{ debt: DebtEntity; payment: DebtPaymentEntity }> {
    const debt = await this.debtRepo.findOne({
      where: { id: debtId, userId: userId.toString(), status: 'active' },
    });
    if (!debt) throw new Error('Không tìm thấy khoản nợ đang mở.');
    const payment = Math.round(Number(amount));
    if (!Number.isFinite(payment) || payment <= 0) throw new Error('Số tiền trả phải lớn hơn 0.');
    if (payment > debt.remainingAmount) throw new Error('Số tiền trả lớn hơn số nợ còn lại.');

    const pDate = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(pDate.getTime())) throw new Error('Ngày thanh toán không hợp lệ.');

    const paymentRecord = await this.debtPaymentRepo.save(
      this.debtPaymentRepo.create({
        debtId: debt.id,
        userId: userId.toString(),
        amount: payment,
        paymentDate: pDate,
        note: note?.trim() || undefined,
      }),
    );

    debt.remainingAmount -= payment;
    if (debt.remainingAmount === 0) {
      debt.status = 'settled';
      debt.settledAt = new Date();
    }
    const updatedDebt = await this.debtRepo.save(debt);
    return { debt: updatedDebt, payment: paymentRecord };
  }

  public async getDebtPayments(userId: number, debtId: string): Promise<DebtPaymentEntity[]> {
    return this.debtPaymentRepo.find({
      where: { debtId, userId: userId.toString() },
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  }

  public async deleteDebt(userId: number, debtId: string): Promise<boolean> {
    const debt = await this.debtRepo.findOne({
      where: { id: debtId, userId: userId.toString() },
    });
    if (!debt) return false;
    await this.debtRepo.remove(debt);
    return true;
  }

  public formatMoney(amount: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  }
}
