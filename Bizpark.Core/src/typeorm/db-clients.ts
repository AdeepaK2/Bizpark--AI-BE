import { DataSource, In } from 'typeorm';
import { adminDataSource, applicationDataSource, runnerDataSource } from './datasources';
import {
    AdminTemplateEntity,
    ApiBusinessEntity,
    ApiBusinessUserEntity,
    ApiUserEntity,
    ApiWebsiteEntity,
    RunnerAgentTaskEntity,
    SubscriptionTier,
    UserRole,
} from './entities';

type OrderDirection = 'asc' | 'desc' | 'ASC' | 'DESC';

const dataSourceInitPromises = new Map<DataSource, Promise<DataSource>>();

const ensureDataSourceInitialized = async (dataSource: DataSource): Promise<DataSource> => {
    if (dataSource.isInitialized) {
        return dataSource;
    }

    const existingInit = dataSourceInitPromises.get(dataSource);
    if (existingInit) {
        return existingInit;
    }

    const initPromise = dataSource.initialize();
    dataSourceInitPromises.set(dataSource, initPromise);

    try {
        return await initPromise;
    } finally {
        dataSourceInitPromises.delete(dataSource);
    }
};

const resolveOrder = (direction?: OrderDirection) => {
    if (!direction) {
        return undefined;
    }
    return String(direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
};

const createApplicationClient = () => ({
    user: {
        findUnique: async (args: { where: { id?: string; email?: string } }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            const repo = ds.getRepository(ApiUserEntity);
            if (args.where.id) {
                return repo.findOne({ where: { id: args.where.id } });
            }
            if (args.where.email) {
                return repo.findOne({ where: { email: args.where.email } });
            }
            return null;
        },
        create: async (args: { data: Pick<ApiUserEntity, 'email' | 'name' | 'passwordHash'> }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            const repo = ds.getRepository(ApiUserEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
    },
    business: {
        create: async (args: {
            data: {
                name: string;
                category?: string | null;
                description?: string | null;
                logoUrl?: string | null;
                subscriptionTier?: SubscriptionTier;
                users?: {
                    create?: { userId: string; role?: UserRole | string } | Array<{ userId: string; role?: UserRole | string }>;
                };
            };
        }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            return ds.transaction(async (manager) => {
                const { users, ...businessData } = args.data;
                const business = manager.create(ApiBusinessEntity, businessData);
                const savedBusiness = await manager.save(ApiBusinessEntity, business);

                const createUsers = users?.create
                    ? Array.isArray(users.create)
                        ? users.create
                        : [users.create]
                    : [];

                for (const createUser of createUsers) {
                    const businessUser = manager.create(ApiBusinessUserEntity, {
                        userId: createUser.userId,
                        businessId: savedBusiness.id,
                        role: (createUser.role as UserRole) || UserRole.EDITOR,
                    });
                    await manager.save(ApiBusinessUserEntity, businessUser);
                }

                return savedBusiness;
            });
        },
        findMany: async (args?: {
            where?: { users?: { some?: { userId?: string } } };
            orderBy?: { createdAt?: OrderDirection };
        }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            const repo = ds.getRepository(ApiBusinessEntity);
            const qb = repo.createQueryBuilder('business');

            const userId = args?.where?.users?.some?.userId;
            if (userId) {
                qb.innerJoin(ApiBusinessUserEntity, 'business_user', 'business_user.businessId = business.id');
                qb.andWhere('business_user.userId = :userId', { userId });
            }

            const order = resolveOrder(args?.orderBy?.createdAt);
            if (order) {
                qb.orderBy('business.createdAt', order);
            }

            return qb.getMany();
        },
        findUnique: async (args: { where: { id: string }; include?: { websites?: boolean } }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            const repo = ds.getRepository(ApiBusinessEntity);
            return repo.findOne({
                where: { id: args.where.id },
                relations: args.include?.websites ? ['websites'] : [],
            });
        },
    },
    website: {
        upsert: async (args: {
            where: { domain?: string | null };
            update: Partial<ApiWebsiteEntity>;
            create: Partial<ApiWebsiteEntity>;
        }) => {
            const ds = await ensureDataSourceInitialized(applicationDataSource);
            const repo = ds.getRepository(ApiWebsiteEntity);

            const domain = args.where.domain ?? args.create.domain ?? null;
            const existing = domain ? await repo.findOne({ where: { domain } }) : null;

            if (existing) {
                repo.merge(existing, args.update);
                return repo.save(existing);
            }

            const created = repo.create({
                ...args.create,
                domain,
            });
            return repo.save(created);
        },
    },
    $disconnect: async () => {
        if (applicationDataSource.isInitialized) {
            await applicationDataSource.destroy();
        }
    },
});

const createAdminClient = () => ({
    template: {
        findMany: async (args?: {
            where?: { type?: string; name?: { in?: string[] } };
            orderBy?: { createdAt?: OrderDirection };
            select?: Record<string, boolean>;
        }) => {
            const ds = await ensureDataSourceInitialized(adminDataSource);
            const repo = ds.getRepository(AdminTemplateEntity);

            const where: Record<string, unknown> = {};
            if (args?.where?.type) {
                where.type = args.where.type;
            }
            if (args?.where?.name?.in?.length) {
                where.name = In(args.where.name.in);
            }

            const result = await repo.find({
                where: Object.keys(where).length ? where : undefined,
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) as 'ASC' | 'DESC' }
                    : undefined,
            });

            if (!args?.select) {
                return result;
            }

            return result.map((row) => {
                const picked: Record<string, unknown> = {};
                for (const [key, enabled] of Object.entries(args.select || {})) {
                    if (enabled) {
                        picked[key] = (row as unknown as Record<string, unknown>)[key];
                    }
                }
                return picked;
            });
        },
        findUnique: async (args: { where: { id: string } }) => {
            const ds = await ensureDataSourceInitialized(adminDataSource);
            const repo = ds.getRepository(AdminTemplateEntity);
            return repo.findOne({ where: { id: args.where.id } });
        },
        create: async (args: { data: Partial<AdminTemplateEntity> }) => {
            const ds = await ensureDataSourceInitialized(adminDataSource);
            const repo = ds.getRepository(AdminTemplateEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
        update: async (args: { where: { id: string }; data: Partial<AdminTemplateEntity> }) => {
            const ds = await ensureDataSourceInitialized(adminDataSource);
            const repo = ds.getRepository(AdminTemplateEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Template ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
    },
    $disconnect: async () => {
        if (adminDataSource.isInitialized) {
            await adminDataSource.destroy();
        }
    },
});

const createRunnerClient = () => ({
    agentTask: {
        create: async (args: { data: Partial<RunnerAgentTaskEntity> }) => {
            const ds = await ensureDataSourceInitialized(runnerDataSource);
            const repo = ds.getRepository(RunnerAgentTaskEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
        update: async (args: { where: { id: string }; data: Partial<RunnerAgentTaskEntity> }) => {
            const ds = await ensureDataSourceInitialized(runnerDataSource);
            const repo = ds.getRepository(RunnerAgentTaskEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Agent task ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
        findUnique: async (args: { where: { id: string } }) => {
            const ds = await ensureDataSourceInitialized(runnerDataSource);
            const repo = ds.getRepository(RunnerAgentTaskEntity);
            return repo.findOne({ where: { id: args.where.id } });
        },
        findMany: async (args?: { orderBy?: { createdAt?: OrderDirection } }) => {
            const ds = await ensureDataSourceInitialized(runnerDataSource);
            const repo = ds.getRepository(RunnerAgentTaskEntity);
            return repo.find({
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) as 'ASC' | 'DESC' }
                    : undefined,
            });
        },
    },
    $disconnect: async () => {
        if (runnerDataSource.isInitialized) {
            await runnerDataSource.destroy();
        }
    },
});

export const applicationDb = createApplicationClient();
export const adminDb = createAdminClient();
export const runnerDb = createRunnerClient();

// Backward-compatible aliases for existing consumers.
export const applicationPrisma = applicationDb;
export const adminPrisma = adminDb;
export const runnerPrisma = runnerDb;
