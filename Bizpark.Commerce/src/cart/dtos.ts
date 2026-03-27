import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId!: string;

  @IsOptional()
  @IsUUID('4', { message: 'variantId must be a valid UUID' })
  variantId?: string | null;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export class CheckoutBeginDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;
}

export class CheckoutCompleteDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;
}
