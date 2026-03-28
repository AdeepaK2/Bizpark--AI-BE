import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { OrderStatus } from '../db/entities';

export class ShippingAddressDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsOptional() @IsString() state?: string;
  @IsString() @IsNotEmpty() postalCode!: string;
  @IsString() @Length(2, 2, { message: 'country must be a 2-letter ISO code' }) country!: string;
}

export class OrderItemDto {
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId!: string;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'unitPrice must be a number' })
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  unitTitle?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] as OrderStatus[], {
    message: 'status must be one of: PENDING, PAID, FULFILLED, CANCELLED',
  })
  status!: OrderStatus;
}
