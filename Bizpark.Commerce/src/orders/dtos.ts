import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { OrderStatus } from '../db/entities';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString() @IsNotEmpty() name!: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString() @IsNotEmpty() line1!: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional() @IsString() line2?: string;

  @ApiProperty({ example: 'Colombo' })
  @IsString() @IsNotEmpty() city!: string;

  @ApiPropertyOptional({ example: 'Western' })
  @IsOptional() @IsString() state?: string;

  @ApiProperty({ example: '10100' })
  @IsString() @IsNotEmpty() postalCode!: string;

  @ApiProperty({ example: 'LK', description: '2-letter ISO country code' })
  @IsString() @Length(2, 2, { message: 'country must be a 2-letter ISO code' }) country!: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;

  @ApiPropertyOptional({ example: 49.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'unitPrice must be a number' })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'Blue T-Shirt — L' })
  @IsOptional()
  @IsString()
  unitTitle?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({ type: () => ShippingAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'], example: 'FULFILLED' })
  @IsIn(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] as OrderStatus[], {
    message: 'status must be one of: PENDING, PAID, FULFILLED, CANCELLED',
  })
  status!: OrderStatus;
}
