export const SubscriptionTier = {
    FREE: 'FREE',
    PRO: 'PRO',
    AGENCY: 'AGENCY',
} as const;
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const SubscriptionStatus = {
    TRIALING: 'TRIALING',
    ACTIVE: 'ACTIVE',
    PAST_DUE: 'PAST_DUE',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const BusinessStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
} as const;
export type BusinessStatus = (typeof BusinessStatus)[keyof typeof BusinessStatus];

export const WebsiteStatus = {
    DRAFT: 'DRAFT',
    GENERATING: 'GENERATING',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    PUBLISHED: 'PUBLISHED',
    UNPUBLISHED: 'UNPUBLISHED',
    FAILED: 'FAILED',
    SUSPENDED: 'SUSPENDED',
} as const;
export type WebsiteStatus = (typeof WebsiteStatus)[keyof typeof WebsiteStatus];

export const AdminRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    SUPPORT: 'SUPPORT',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const TemplateType = {
    SHOWCASE: 'SHOWCASE',
    ECOMMERCE_ITEM: 'ECOMMERCE_ITEM',
    ECOMMERCE_SUBSCRIPTION: 'ECOMMERCE_SUBSCRIPTION',
} as const;
export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export const TaskStatus = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
    WEBSITE_GENERATION: 'WEBSITE_GENERATION',
    SOCIAL_MEDIA_CONTENT: 'SOCIAL_MEDIA_CONTENT',
    BLOG_POST_WRITING: 'BLOG_POST_WRITING',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const UserRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
