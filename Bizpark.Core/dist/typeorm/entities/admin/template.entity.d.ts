import { BaseEntityWithTimestamps, OrmTemplateType } from '../shared';
export declare class AdminTemplateEntity extends BaseEntityWithTimestamps {
    name: string;
    description: string | null;
    type: OrmTemplateType;
    deployment: Record<string, unknown>;
    cmsSchema: Record<string, unknown>;
    baseHtmlUrl: string | null;
}
