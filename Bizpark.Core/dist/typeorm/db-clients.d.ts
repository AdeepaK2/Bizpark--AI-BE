import { AdminAuditLogEntity, AdminTemplateEntity, AdminUserEntity, ApiBusinessEntity, ApiSubscriptionEntity, ApiUserEntity, ApiWebsiteEntity, BusinessStatus, RunnerAgentTaskEntity, SubscriptionStatus, SubscriptionTier, UserRole, WebsiteStatus } from './entities';
type OrderDirection = 'asc' | 'desc' | 'ASC' | 'DESC';
export declare const applicationDb: {
    user: {
        findUnique: (args: {
            where: {
                id?: string;
                email?: string;
            };
        }) => Promise<ApiUserEntity | null>;
        create: (args: {
            data: Pick<ApiUserEntity, "email" | "name" | "passwordHash">;
        }) => Promise<ApiUserEntity>;
        findMany: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiUserEntity[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<ApiUserEntity>;
        }) => Promise<ApiUserEntity>;
        count: () => Promise<number>;
    };
    business: {
        create: (args: {
            data: {
                name: string;
                category?: string | null;
                description?: string | null;
                logoUrl?: string | null;
                subscriptionTier?: SubscriptionTier;
                status?: BusinessStatus;
                users?: {
                    create?: {
                        userId: string;
                        role?: UserRole | string;
                    } | Array<{
                        userId: string;
                        role?: UserRole | string;
                    }>;
                };
            };
        }) => Promise<ApiBusinessEntity>;
        findMany: (args?: {
            where?: {
                users?: {
                    some?: {
                        userId?: string;
                    };
                };
            };
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiBusinessEntity[]>;
        findUnique: (args: {
            where: {
                id: string;
            };
            include?: {
                websites?: boolean;
            };
        }) => Promise<ApiBusinessEntity | null>;
        findForAdmin: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiBusinessEntity[]>;
        findUniqueForAdmin: (args: {
            where: {
                id: string;
            };
        }) => Promise<ApiBusinessEntity | null>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<ApiBusinessEntity>;
        }) => Promise<ApiBusinessEntity>;
        count: (args?: {
            where?: {
                status?: BusinessStatus;
            };
        }) => Promise<number>;
    };
    website: {
        upsert: (args: {
            where: {
                domain?: string | null;
            };
            update: Partial<ApiWebsiteEntity>;
            create: Partial<ApiWebsiteEntity>;
        }) => Promise<ApiWebsiteEntity>;
        findMany: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiWebsiteEntity[]>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<ApiWebsiteEntity | null>;
        findFirstByBusinessId: (args: {
            businessId: string;
        }) => Promise<ApiWebsiteEntity | null>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<ApiWebsiteEntity>;
        }) => Promise<ApiWebsiteEntity>;
        count: (args?: {
            where?: {
                status?: WebsiteStatus;
            };
        }) => Promise<number>;
    };
    subscription: {
        findMany: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiSubscriptionEntity[]>;
        findLatestForBusiness: (args: {
            businessId: string;
        }) => Promise<ApiSubscriptionEntity | null>;
        upsertForBusiness: (args: {
            businessId: string;
            data: Partial<ApiSubscriptionEntity> & {
                tier?: SubscriptionTier;
                status?: SubscriptionStatus;
            };
        }) => Promise<ApiSubscriptionEntity>;
        count: (args?: {
            where?: {
                status?: SubscriptionStatus;
            };
        }) => Promise<number>;
    };
    $disconnect: () => Promise<void>;
};
export declare const adminDb: {
    adminUser: {
        findUnique: (args: {
            where: {
                id?: string;
                email?: string;
            };
        }) => Promise<AdminUserEntity | null>;
        findMany: () => Promise<AdminUserEntity[]>;
        create: (args: {
            data: Partial<AdminUserEntity>;
        }) => Promise<AdminUserEntity>;
        count: () => Promise<number>;
    };
    auditLog: {
        create: (args: {
            data: Partial<AdminAuditLogEntity>;
        }) => Promise<AdminAuditLogEntity>;
        findMany: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<AdminAuditLogEntity[]>;
    };
    template: {
        findMany: (args?: {
            where?: {
                type?: string;
                name?: {
                    in?: string[];
                };
            };
            orderBy?: {
                createdAt?: OrderDirection;
            };
            select?: Record<string, boolean>;
        }) => Promise<AdminTemplateEntity[] | Record<string, unknown>[]>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<AdminTemplateEntity | null>;
        create: (args: {
            data: Partial<AdminTemplateEntity>;
        }) => Promise<AdminTemplateEntity>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<AdminTemplateEntity>;
        }) => Promise<AdminTemplateEntity>;
    };
    $disconnect: () => Promise<void>;
};
export declare const runnerDb: {
    agentTask: {
        create: (args: {
            data: Partial<RunnerAgentTaskEntity>;
        }) => Promise<RunnerAgentTaskEntity>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<RunnerAgentTaskEntity>;
        }) => Promise<RunnerAgentTaskEntity>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<RunnerAgentTaskEntity | null>;
        findMany: (args?: {
            orderBy?: {
                createdAt?: OrderDirection;
            };
        }) => Promise<RunnerAgentTaskEntity[]>;
        count: (args?: {
            where?: {
                status?: string;
            };
        }) => Promise<number>;
    };
    $disconnect: () => Promise<void>;
};
export {};
