import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'product_variants' })
export class ProductVariantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  // Human-readable variant label e.g. "Red / Medium"
  @Column({ type: 'varchar', length: 500 })
  title!: string;

  // Structured attributes e.g. { color: "Red", size: "Medium" }
  @Column({ type: 'jsonb', nullable: true })
  attributes!: Record<string, string> | null;

  // Optional price override; null = use parent product price
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price!: number | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  sku!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
