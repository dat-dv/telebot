import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

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

  @Column({ name: 'notify_type', type: 'varchar', default: 'text' })
  notifyType: 'text' | 'call';

  @Column({ name: 'repeat_type', type: 'varchar', default: 'none' })
  repeatType: 'none' | 'daily' | 'weekly';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
