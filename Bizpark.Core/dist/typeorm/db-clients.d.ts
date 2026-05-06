import { AdminTemplateEntity, ApiBusinessEntity, ApiGoogleBusinessConnectionEntity, ApiGoogleBusinessReviewEntity, ApiUserEntity, ApiWebsiteEntity, RunnerAgentTaskEntity, SubscriptionTier, UserRole } from './entities';
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
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<ApiBusinessEntity>;
        }) => Promise<ApiBusinessEntity>;
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
    googleBusinessConnection: {
        findFirst: (args: {
            where: {
                businessId: string;
            };
        }) => Promise<ApiGoogleBusinessConnectionEntity | null>;
        upsertByBusinessId: (args: {
            businessId: string;
            create: Partial<ApiGoogleBusinessConnectionEntity>;
            update: Partial<ApiGoogleBusinessConnectionEntity>;
        }) => Promise<ApiGoogleBusinessConnectionEntity>;
    };
    googleBusinessReview: {
        findMany: (args: {
            where?: {
                businessId?: string;
                status?: string;
                agentTaskId?: string;
            };
            orderBy?: {
                reviewCreateTime?: OrderDirection;
                createdAt?: OrderDirection;
            };
        }) => Promise<ApiGoogleBusinessReviewEntity[]>;
        findUnique: (args: {
            where: {
                id?: string;
                reviewName?: string;
            };
        }) => Promise<ApiGoogleBusinessReviewEntity | null>;
        upsertByReviewName: (args: {
            reviewName: string;
            create: Partial<ApiGoogleBusinessReviewEntity>;
            update: Partial<ApiGoogleBusinessReviewEntity>;
        }) => Promise<ApiGoogleBusinessReviewEntity>;
        update: (args: {
            where: {
                id: string;
            };
            data: Partial<ApiGoogleBusinessReviewEntity>;
        }) => Promise<ApiGoogleBusinessReviewEntity>;
    };
    $disconnect: () => Promise<void>;
};
export declare const adminDb: {
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
    };
    $disconnect: () => Promise<void>;
};
export {};
