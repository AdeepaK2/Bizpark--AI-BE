import { Injectable } from '@nestjs/common';
import { applicationDb } from 'bizpark.core';

@Injectable()
export class SubscriptionsService {
  list() {
    return applicationDb.subscription.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
