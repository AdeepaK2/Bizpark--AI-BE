export declare const SubscriptionTier: {
    readonly FREE: "FREE";
    readonly PRO: "PRO";
    readonly AGENCY: "AGENCY";
};
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];
export declare const TemplateType: {
    readonly SHOWCASE: "SHOWCASE";
    readonly ECOMMERCE_ITEM: "ECOMMERCE_ITEM";
    readonly ECOMMERCE_SUBSCRIPTION: "ECOMMERCE_SUBSCRIPTION";
};
export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];
export declare const TaskStatus: {
    readonly QUEUED: "QUEUED";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
};
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export declare const TaskType: {
    readonly WEBSITE_GENERATION: "WEBSITE_GENERATION";
    readonly SOCIAL_MEDIA_CONTENT: "SOCIAL_MEDIA_CONTENT";
    readonly BLOG_POST_WRITING: "BLOG_POST_WRITING";
};
export type TaskType = (typeof TaskType)[keyof typeof TaskType];
export declare const UserRole: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly EDITOR: "EDITOR";
    readonly VIEWER: "VIEWER";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
