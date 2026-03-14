import { BaseEntityWithTimestamps, OrmSubscriptionTier } from '../shared';
export declare class ApiBusinessEntity extends BaseEntityWithTimestamps {
    name: string;
    category: string | null;
    description: string | null;
    logoUrl: string | null;
    subscriptionTier: OrmSubscriptionTier;
}
