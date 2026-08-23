import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'varchar', default: 'Khác' })
  category: string;

  @Column({ type: 'varchar' })
  note: string;

  @Index()
  @Column({ name: 'occurred_at', type: 'datetime' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
