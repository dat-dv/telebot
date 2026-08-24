import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DebtContactEntity } from './debt-contact.entity';

@Entity('finance_transactions')
export class FinanceTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  type: 'income' | 'expense';

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', default: 'Khác' })
  category: string;

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod?: string;

  @Column({ name: 'receipt_url', type: 'varchar', nullable: true })
  receiptUrl?: string;

  @Index()
  @Column({ name: 'contact_id', type: 'varchar', nullable: true })
  contactId?: string;

  @ManyToOne(() => DebtContactEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact?: DebtContactEntity;

  @Column({ type: 'varchar' })
  note: string;

  @Index()
  @Column({ name: 'occurred_at', type: Date })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
