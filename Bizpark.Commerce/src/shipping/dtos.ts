import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingMethodDto {
  @ApiProperty({ example: 'STANDARD' })
  @IsString() @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Standard Shipping (5-7 days)' })
  @IsString() @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 5.99 })
  @Type(() => Number) @IsNumber() @Min(0)
  flatRate!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional() @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateShippingMethodDto {
  @ApiPropertyOptional({ example: 'Express Shipping (2-3 days)' })
  @IsOptional() @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 12.99 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  flatRate?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional() @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class ShippingQuoteDto {
  @ApiProperty({ example: 'STANDARD' })
  @IsString() @IsNotEmpty()
  methodCode!: string;

  @ApiPropertyOptional({ example: 1.5, description: 'Package weight in kg' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 49.99 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  orderSubtotal?: number;
}
