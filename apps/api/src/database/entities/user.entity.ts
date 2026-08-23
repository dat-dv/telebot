import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { SupportedLocale } from '@telebot/contracts';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('varchar')
  id: string; // Store numeric Telegram ID as string for precision

  @Column({ type: 'varchar', nullable: true })
  username?: string;

  @Column({ type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', default: 'user' })
  role: 'admin' | 'user';

  @Column({ type: 'varchar', default: 'vi' })
  preferredLocale: SupportedLocale;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
