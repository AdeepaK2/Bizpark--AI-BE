import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { SubscriptionStatus } from '../db/entities';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  planCode!: string;
}

export class UpdateSubscriptionStatusDto {
  @IsIn(['ACTIVE', 'PAST_DUE', 'CANCELLED'] as SubscriptionStatus[], {
    message: 'status must be one of: ACTIVE, PAST_DUE, CANCELLED',
  })
  status!: SubscriptionStatus;
}
