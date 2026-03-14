import { UserRole } from '../shared';
import { ApiBusinessEntity } from './business.entity';
import { ApiUserEntity } from './user.entity';
export declare class ApiBusinessUserEntity {
    userId: string;
    businessId: string;
    role: UserRole;
    createdAt: Date;
    user: ApiUserEntity;
    business: ApiBusinessEntity;
}
