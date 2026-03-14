import { BaseEntityWithTimestamps } from '../shared';
import { ApiBusinessEntity } from './business.entity';
export declare class ApiWebsiteEntity extends BaseEntityWithTimestamps {
    businessId: string;
    domain: string | null;
    vercelUrl: string | null;
    cmsData: Record<string, unknown> | null;
    templateId: string;
    business: ApiBusinessEntity;
}
