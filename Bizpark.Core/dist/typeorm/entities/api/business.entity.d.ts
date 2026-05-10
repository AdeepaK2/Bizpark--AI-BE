import { BaseEntityWithTimestamps, BusinessStatus, SubscriptionTier } from '../shared';
import { ApiBusinessUserEntity } from './business-user.entity';
import { ApiSubscriptionEntity } from './subscription.entity';
import { ApiWebsiteEntity } from './website.entity';
export declare class ApiBusinessEntity extends BaseEntityWithTimestamps {
    name: string;
    category: string | null;
    description: string | null;
    logoUrl: string | null;
    subscriptionTier: SubscriptionTier;
    status: BusinessStatus;
    users: ApiBusinessUserEntity[];
    websites: ApiWebsiteEntity[];
    subscriptions: ApiSubscriptionEntity[];
}
