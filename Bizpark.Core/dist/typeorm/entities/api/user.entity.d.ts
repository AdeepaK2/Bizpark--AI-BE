import { BaseEntityWithTimestamps } from '../shared';
import { ApiBusinessUserEntity } from './business-user.entity';
export declare class ApiUserEntity extends BaseEntityWithTimestamps {
    email: string;
    passwordHash: string;
    name: string;
    isActive: boolean;
    businesses: ApiBusinessUserEntity[];
}
