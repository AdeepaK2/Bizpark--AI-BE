"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.TaskType = exports.TaskStatus = exports.TemplateType = exports.AdminRole = exports.WebsiteStatus = exports.BusinessStatus = exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
exports.SubscriptionTier = {
    FREE: 'FREE',
    PRO: 'PRO',
    AGENCY: 'AGENCY',
};
exports.SubscriptionStatus = {
    TRIALING: 'TRIALING',
    ACTIVE: 'ACTIVE',
    PAST_DUE: 'PAST_DUE',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
};
exports.BusinessStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
};
exports.WebsiteStatus = {
    DRAFT: 'DRAFT',
    GENERATING: 'GENERATING',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    PUBLISHED: 'PUBLISHED',
    UNPUBLISHED: 'UNPUBLISHED',
    FAILED: 'FAILED',
    SUSPENDED: 'SUSPENDED',
};
exports.AdminRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    SUPPORT: 'SUPPORT',
};
exports.TemplateType = {
    SHOWCASE: 'SHOWCASE',
    ECOMMERCE_ITEM: 'ECOMMERCE_ITEM',
    ECOMMERCE_SUBSCRIPTION: 'ECOMMERCE_SUBSCRIPTION',
};
exports.TaskStatus = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};
exports.TaskType = {
    WEBSITE_GENERATION: 'WEBSITE_GENERATION',
    SOCIAL_MEDIA_CONTENT: 'SOCIAL_MEDIA_CONTENT',
    BLOG_POST_WRITING: 'BLOG_POST_WRITING',
};
exports.UserRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER',
};
