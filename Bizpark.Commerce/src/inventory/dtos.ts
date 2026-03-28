import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertInventoryDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsString() @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 'TSHIRT-L-BLUE' })
  @IsString() @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number) @IsNumber() @Min(0)
  availableQuantity!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  reservedQuantity?: number;

  @ApiPropertyOptional({ example: 'uuid-of-variant' })
  @IsOptional() @IsString()
  variantId?: string;
}

export class ReserveInventoryDto {
  @ApiProperty({ example: 'TSHIRT-L-BLUE' })
  @IsString() @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number) @IsNumber() @Min(1)
  quantity!: number;
}
