import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
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

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export class CheckoutShippingAddressDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsOptional() @IsString() state?: string;
  @IsString() @IsNotEmpty() postalCode!: string;
  @IsString() @IsNotEmpty() country!: string;
}

export class CheckoutCompleteDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsOptional()
  shippingAddress?: CheckoutShippingAddressDto;
}
