import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-order' })
  @IsOptional()
  @IsUUID('4', { message: 'orderId must be a valid UUID' })
  orderId?: string;

  @ApiProperty({ example: 99.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(0, { message: 'amount must be non-negative' })
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
