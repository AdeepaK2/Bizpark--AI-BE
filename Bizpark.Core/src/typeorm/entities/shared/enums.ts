export const SubscriptionTier = {
    FREE: 'FREE',
    PRO: 'PRO',
    AGENCY: 'AGENCY',
} as const;
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const TemplateType = {
    SHOWCASE: 'SHOWCASE',
    ECOMMERCE_ITEM: 'ECOMMERCE_ITEM',
    ECOMMERCE_SUBSCRIPTION: 'ECOMMERCE_SUBSCRIPTION',
} as const;
export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export const TaskStatus = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
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
