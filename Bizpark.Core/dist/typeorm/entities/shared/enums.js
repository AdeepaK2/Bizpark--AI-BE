"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.TaskType = exports.TaskStatus = exports.TemplateType = exports.SubscriptionTier = void 0;
exports.SubscriptionTier = {
    FREE: 'FREE',
    PRO: 'PRO',
    AGENCY: 'AGENCY',
};
exports.TemplateType = {
    SHOWCASE: 'SHOWCASE',
    ECOMMERCE_ITEM: 'ECOMMERCE_ITEM',
    ECOMMERCE_SUBSCRIPTION: 'ECOMMERCE_SUBSCRIPTION',
};
exports.TaskStatus = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
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
