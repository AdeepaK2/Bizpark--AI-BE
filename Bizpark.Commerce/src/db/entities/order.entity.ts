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

  // Shipping address (captured at order time)
  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingLine1!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingLine2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingCity!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingState!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingPostalCode!: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  shippingCountry!: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true, eager: true })
  items!: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
