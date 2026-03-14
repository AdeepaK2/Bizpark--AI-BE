import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps, TemplateType } from '../shared';

@Entity({ name: 'templates' })
export class AdminTemplateEntity extends BaseEntityWithTimestamps {
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        type: 'enum',
        enum: TemplateType,
        enumName: 'template_type_enum',
        default: TemplateType.SHOWCASE,
    })
    type!: TemplateType;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    deployment!: unknown;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    cmsSchema!: unknown;

    @Column({ type: 'text', nullable: true })
    baseHtmlUrl!: string | null;
}
