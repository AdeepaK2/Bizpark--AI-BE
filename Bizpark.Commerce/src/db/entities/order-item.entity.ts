import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  // Price + title snapshots — locked at order creation so historical records stay accurate
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  unitPrice!: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  unitTitle!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal!: number;   // quantity * unitPrice

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  order!: OrderEntity;
}
