import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

export type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: OrderStatus;

  // Calculated total at order creation — sum of all item subtotals
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount!: number;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true, eager: true })
  items!: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
