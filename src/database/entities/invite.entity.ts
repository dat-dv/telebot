import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invites')
export class InviteEntity {
  @PrimaryColumn('varchar')
  code: string; // e.g. "invite_abc123"

  @Column('varchar')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('varchar')
  expiresAt: string;

  @Column({ type: 'varchar', nullable: true })
  usedBy?: string;

  @Column({ type: 'varchar', nullable: true })
  usedAt?: string;
}
