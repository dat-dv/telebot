import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../database/entities/finance-transaction.entity';
import { DebtEntity } from '../database/entities/debt.entity';
import { DebtContactEntity } from '../database/entities/debt-contact.entity';

export interface CreateFinanceTransactionDto {
  userId: number;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
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
  note?: string;
  dueAt?: string;
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
      category: dto.category?.trim() || 'Khác',
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

  private async createContact(
    userId: number,
    name: string,
    alias?: string,
  ): Promise<DebtContactEntity> {
    const displayName = name?.trim();
    if (!displayName) throw new Error('Cần có tên người liên quan.');
    return this.contactRepo.save(
      this.contactRepo.create({
        userId: userId.toString(),
        displayName,
        alias: alias?.trim() || undefined,
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
      .where('debt.user_id = :userId', { userId: userId.toString() })
      .andWhere('debt.status = :status', { status: 'active' })
      .orderBy('debt.created_at', 'DESC')
      .getMany();
  }

  public async updateContact(
    userId: number,
    contactId: string,
    name: string,
    alias?: string,
  ): Promise<DebtContactEntity> {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, userId: userId.toString() },
    });
    if (!contact) throw new Error('Không tìm thấy người trong danh bạ công nợ.');
    const displayName = name?.trim();
    if (!displayName) throw new Error('Tên không được để trống.');
    contact.displayName = displayName;
    contact.alias = alias?.trim() || undefined;
    contact.normalizedName = this.normalizeIdentity(displayName);
    contact.normalizedAlias = alias ? this.normalizeIdentity(alias) : undefined;
    return this.contactRepo.save(contact);
  }

  public async recordDebtPayment(
    userId: number,
    debtId: string,
    amount: number,
  ): Promise<DebtEntity> {
    const debt = await this.debtRepo.findOne({
      where: { id: debtId, userId: userId.toString(), status: 'active' },
    });
    if (!debt) throw new Error('Không tìm thấy khoản nợ đang mở.');
    const payment = Math.round(Number(amount));
    if (!Number.isFinite(payment) || payment <= 0) throw new Error('Số tiền trả phải lớn hơn 0.');
    if (payment > debt.remainingAmount) throw new Error('Số tiền trả lớn hơn số nợ còn lại.');
    debt.remainingAmount -= payment;
    if (debt.remainingAmount === 0) debt.status = 'settled';
    return this.debtRepo.save(debt);
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
