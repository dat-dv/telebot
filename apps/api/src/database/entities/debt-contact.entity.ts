import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('debt_contacts')
export class DebtContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ name: 'display_name', type: 'varchar' })
  displayName: string;

  @Column({ type: 'varchar', nullable: true })
  alias?: string;

  @Index()
  @Column({ name: 'normalized_name', type: 'varchar' })
  normalizedName: string;

  @Index()
  @Column({ name: 'normalized_alias', type: 'varchar', nullable: true })
  normalizedAlias?: string;

  @Column({ type: 'varchar', nullable: true })
  descriptor?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
