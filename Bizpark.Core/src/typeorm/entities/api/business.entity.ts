import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntityWithTimestamps, SubscriptionTier } from '../shared';
import { ApiBusinessUserEntity } from './business-user.entity';
import { ApiWebsiteEntity } from './website.entity';

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
        enum: SubscriptionTier,
        enumName: 'business_subscription_tier_enum',
        default: SubscriptionTier.FREE,
    })
    subscriptionTier!: SubscriptionTier;

    @OneToMany(() => ApiBusinessUserEntity, (businessUser) => businessUser.business)
    users!: ApiBusinessUserEntity[];

    @OneToMany(() => ApiWebsiteEntity, (website) => website.business)
    websites!: ApiWebsiteEntity[];
}
