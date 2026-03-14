import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps, OrmSubscriptionTier } from '../shared';

@Entity({ name: 'businesses' })
export class ApiBusinessEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    category!: string | null;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'text', nullable: true })
    logoUrl!: string | null;

    @Column({
        type: 'enum',
        enum: OrmSubscriptionTier,
        enumName: 'business_subscription_tier_enum',
        default: OrmSubscriptionTier.FREE,
    })
    subscriptionTier!: OrmSubscriptionTier;
}
