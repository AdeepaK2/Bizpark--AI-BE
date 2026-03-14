import { BaseEntityWithTimestamps, TemplateType } from '../shared';
export declare class AdminTemplateEntity extends BaseEntityWithTimestamps {
    name: string;
    description: string | null;
    type: TemplateType;
    deployment: unknown;
    cmsSchema: unknown;
    baseHtmlUrl: string | null;
}
