import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SubscriptionStatus } from '../db/entities';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: 'pro-monthly' })
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @ApiPropertyOptional({ enum: ['weekly', 'monthly', 'yearly'], example: 'monthly' })
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'], { message: 'billingInterval must be weekly, monthly, or yearly' })
  billingInterval?: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt must be a valid ISO 8601 date' })
  expiresAt?: string;
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED'], example: 'CANCELLED' })
  @IsIn(['ACTIVE', 'PAST_DUE', 'CANCELLED'] as SubscriptionStatus[], {
    message: 'status must be one of: ACTIVE, PAST_DUE, CANCELLED',
  })
  status!: SubscriptionStatus;
}
