import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'table_name', type: 'varchar' })
  tableName: string;

  @Index()
  @Column({ name: 'record_id', type: 'varchar', nullable: true })
  recordId?: string;

  @Column({ type: 'varchar' })
  action: 'insert' | 'update' | 'remove';

  @Index()
  @Column({ name: 'actor_id', type: 'varchar', nullable: true })
  actorId?: string;

  @Column({ name: 'before_data', type: 'simple-json', nullable: true })
  beforeData?: Record<string, unknown>;

  @Column({ name: 'after_data', type: 'simple-json', nullable: true })
  afterData?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
