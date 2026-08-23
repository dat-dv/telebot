import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dashboard_exchange_tokens')
export class DashboardExchangeTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'varchar' })
  tokenHash: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'datetime', nullable: true })
  consumedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
