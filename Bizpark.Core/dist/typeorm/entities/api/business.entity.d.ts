import { BaseEntityWithTimestamps, SubscriptionTier } from '../shared';
import { ApiBusinessUserEntity } from './business-user.entity';
import { ApiWebsiteEntity } from './website.entity';
export declare class ApiBusinessEntity extends BaseEntityWithTimestamps {
    name: string;
    category: string | null;
    description: string | null;
    logoUrl: string | null;
    subscriptionTier: SubscriptionTier;
    users: ApiBusinessUserEntity[];
    websites: ApiWebsiteEntity[];
}
