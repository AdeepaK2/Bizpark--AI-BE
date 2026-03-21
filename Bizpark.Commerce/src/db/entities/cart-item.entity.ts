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

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart!: CartEntity;
}
