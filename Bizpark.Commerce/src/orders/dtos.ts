import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { OrderStatus } from '../db/entities';

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
}

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] as OrderStatus[], {
    message: 'status must be one of: PENDING, PAID, FULFILLED, CANCELLED',
  })
  status!: OrderStatus;
}
