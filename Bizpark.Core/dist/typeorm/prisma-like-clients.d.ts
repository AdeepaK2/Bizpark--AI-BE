import { AdminTemplateEntity, ApiBusinessEntity, ApiUserEntity, ApiWebsiteEntity, RunnerAgentTaskEntity, SubscriptionTier, UserRole } from './entities';
type OrderDirection = 'asc' | 'desc' | 'ASC' | 'DESC';
export declare const applicationPrisma: {
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
    };
    business: {
        create: (args: {
            data: {
                name: string;
                category?: string | null;
                description?: string | null;
                logoUrl?: string | null;
                subscriptionTier?: SubscriptionTier;
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
    };
    website: {
        upsert: (args: {
            where: {
                domain?: string | null;
            };
            update: Partial<ApiWebsiteEntity>;
            create: Partial<ApiWebsiteEntity>;
        }) => Promise<ApiWebsiteEntity>;
    };
    $disconnect: () => Promise<void>;
};
export declare const adminPrisma: {
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
export declare const runnerPrisma: {
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
    };
    $disconnect: () => Promise<void>;
};
export {};
