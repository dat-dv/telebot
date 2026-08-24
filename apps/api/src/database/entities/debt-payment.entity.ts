import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DebtEntity } from './debt.entity';

@Entity('debt_payments')
export class DebtPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'debt_id', type: 'varchar' })
  debtId: string;

  @ManyToOne(() => DebtEntity, (debt) => debt.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debt_id' })
  debt?: DebtEntity;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ name: 'payment_date', type: 'datetime' })
  paymentDate: Date;

  @Column({ type: 'varchar', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
