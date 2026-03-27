import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity({ name: 'cart_items' })
export class CartItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  // Price snapshot at the time the item was added to cart
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  unitPrice!: number;

  // Product title snapshot (so cart displays correctly even if product is renamed)
  @Column({ type: 'varchar', length: 500, default: '' })
  unitTitle!: string;

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart!: CartEntity;
}
