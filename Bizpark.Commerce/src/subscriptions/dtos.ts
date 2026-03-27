import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { SubscriptionStatus } from '../db/entities';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'], { message: 'billingInterval must be weekly, monthly, or yearly' })
  billingInterval?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt must be a valid ISO 8601 date' })
  expiresAt?: string;
}

export class UpdateSubscriptionStatusDto {
  @IsIn(['ACTIVE', 'PAST_DUE', 'CANCELLED'] as SubscriptionStatus[], {
    message: 'status must be one of: ACTIVE, PAST_DUE, CANCELLED',
  })
  status!: SubscriptionStatus;
}
