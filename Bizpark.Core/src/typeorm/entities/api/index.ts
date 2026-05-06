import { ApiBusinessEntity } from './business.entity';
import { ApiBusinessUserEntity } from './business-user.entity';
import { ApiGoogleBusinessConnectionEntity } from './google-business-connection.entity';
import { ApiGoogleBusinessReviewEntity } from './google-business-review.entity';
import { ApiUserEntity } from './user.entity';
import { ApiWebsiteEntity } from './website.entity';

export const API_ENTITIES = [
    ApiUserEntity,
    ApiBusinessEntity,
    ApiBusinessUserEntity,
    ApiWebsiteEntity,
    ApiGoogleBusinessConnectionEntity,
    ApiGoogleBusinessReviewEntity,
];

export * from './business.entity';
export * from './business-user.entity';
export * from './google-business-connection.entity';
export * from './google-business-review.entity';
export * from './user.entity';
export * from './website.entity';
