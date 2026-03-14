import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithTimestamps } from '../shared';
import { ApiBusinessEntity } from './business.entity';

@Entity({ name: 'websites' })
export class ApiWebsiteEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'uuid' })
    businessId!: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    domain!: string | null;

    @Column({ type: 'text', nullable: true })
    vercelUrl!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    cmsData!: Record<string, unknown> | null;

    @Column({ type: 'uuid' })
    templateId!: string;

    @ManyToOne(() => ApiBusinessEntity, (business) => business.websites, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessId' })
    business!: ApiBusinessEntity;
}
