import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @Column({ type: 'varchar', length: 100 })
  planCode!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: SubscriptionStatus;

  // e.g. 'monthly', 'yearly', 'weekly'
  @Column({ type: 'varchar', length: 50, nullable: true })
  billingInterval!: string | null;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  // When the current billing period ends / subscription expires
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  // Next scheduled renewal date
  @Column({ type: 'timestamptz', nullable: true })
  renewsAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
