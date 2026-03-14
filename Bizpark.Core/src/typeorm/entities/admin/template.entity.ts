import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps, OrmTemplateType } from '../shared';

@Entity({ name: 'templates' })
export class AdminTemplateEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        type: 'enum',
        enum: OrmTemplateType,
        enumName: 'template_type_enum',
        default: OrmTemplateType.SHOWCASE,
    })
    type!: OrmTemplateType;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    deployment!: Record<string, unknown>;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    cmsSchema!: Record<string, unknown>;

    @Column({ type: 'text', nullable: true })
    baseHtmlUrl!: string | null;
}
