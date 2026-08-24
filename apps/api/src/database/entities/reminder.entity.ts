import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reminders')
export class ReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Index()
  @Column({ name: 'remind_at', type: 'datetime' })
  remindAt: Date;

  @Index()
  @Column({ name: 'is_triggered', type: 'boolean', default: false })
  isTriggered: boolean;

  @Index()
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';

  @Column({ name: 'snooze_count', type: 'integer', default: 0 })
  snoozeCount: number;

  @Column({ name: 'snoozed_until', type: 'datetime', nullable: true })
  snoozedUntil?: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ name: 'notify_type', type: 'varchar', default: 'text' })
  notifyType: 'text' | 'call';

  @Column({ name: 'repeat_type', type: 'varchar', default: 'none' })
  repeatType: 'none' | 'daily' | 'weekly';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
