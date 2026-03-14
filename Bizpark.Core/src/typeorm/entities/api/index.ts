import { ApiBusinessEntity } from './business.entity';
import { ApiBusinessUserEntity } from './business-user.entity';
import { ApiUserEntity } from './user.entity';
import { ApiWebsiteEntity } from './website.entity';

export const API_ENTITIES = [ApiUserEntity, ApiBusinessEntity, ApiBusinessUserEntity, ApiWebsiteEntity];

export * from './business.entity';
export * from './business-user.entity';
export * from './user.entity';
export * from './website.entity';
