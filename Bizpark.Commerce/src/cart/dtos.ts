import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-variant', nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'variantId must be a valid UUID' })
  variantId?: string | null;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export class CheckoutBeginDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export class CheckoutShippingAddressDto {
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

  @ApiProperty({ example: 'LK' })
  @IsString() @IsNotEmpty() country!: string;
}

export class CheckoutCompleteDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({ type: () => CheckoutShippingAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutShippingAddressDto)
  shippingAddress?: CheckoutShippingAddressDto;
}
