"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runnerDb = exports.adminDb = exports.applicationDb = void 0;
const typeorm_1 = require("typeorm");
const datasources_1 = require("./datasources");
const entities_1 = require("./entities");
const dataSourceInitPromises = new Map();
const ensureDataSourceInitialized = async (dataSource) => {
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
    }
    finally {
        dataSourceInitPromises.delete(dataSource);
    }
};
const resolveOrder = (direction) => {
    if (!direction) {
        return undefined;
    }
    return String(direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
};
const createApplicationClient = () => ({
    user: {
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiUserEntity);
            if (args.where.id) {
                return repo.findOne({ where: { id: args.where.id } });
            }
            if (args.where.email) {
                return repo.findOne({ where: { email: args.where.email } });
            }
            return null;
        },
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiUserEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiUserEntity);
            return repo.find({
                relations: ['businesses', 'businesses.business'],
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : undefined,
            });
        },
        update: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiUserEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`User ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
        count: async () => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiUserEntity).count();
        },
    },
    business: {
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.transaction(async (manager) => {
                const { users, ...businessData } = args.data;
                const business = manager.create(entities_1.ApiBusinessEntity, {
                    ...businessData,
                    status: businessData.status ?? entities_1.BusinessStatus.ACTIVE,
                });
                const savedBusiness = await manager.save(entities_1.ApiBusinessEntity, business);
                const createUsers = users?.create
                    ? Array.isArray(users.create)
                        ? users.create
                        : [users.create]
                    : [];
                for (const createUser of createUsers) {
                    const businessUser = manager.create(entities_1.ApiBusinessUserEntity, {
                        userId: createUser.userId,
                        businessId: savedBusiness.id,
                        role: createUser.role || entities_1.UserRole.EDITOR,
                    });
                    await manager.save(entities_1.ApiBusinessUserEntity, businessUser);
                }
                return savedBusiness;
            });
        },
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiBusinessEntity);
            const qb = repo.createQueryBuilder('business');
            const userId = args?.where?.users?.some?.userId;
            if (userId) {
                qb.innerJoin(entities_1.ApiBusinessUserEntity, 'business_user', 'business_user.businessId = business.id');
                qb.andWhere('business_user.userId = :userId', { userId });
            }
            const order = resolveOrder(args?.orderBy?.createdAt);
            if (order) {
                qb.orderBy('business.createdAt', order);
            }
            return qb.getMany();
        },
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiBusinessEntity);
            return repo.findOne({
                where: { id: args.where.id },
                relations: args.include?.websites ? ['websites'] : [],
            });
        },
        findForAdmin: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiBusinessEntity);
            return repo.find({
                relations: ['users', 'users.user', 'websites', 'subscriptions'],
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : { createdAt: 'DESC' },
            });
        },
        findUniqueForAdmin: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiBusinessEntity).findOne({
                where: { id: args.where.id },
                relations: ['users', 'users.user', 'websites', 'subscriptions'],
            });
        },
        update: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiBusinessEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Business ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
        count: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiBusinessEntity).count({
                where: args?.where?.status ? { status: args.where.status } : undefined,
            });
        },
    },
    website: {
        upsert: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiWebsiteEntity);
            const domain = args.where.domain ?? args.create.domain ?? null;
            const existing = domain ? await repo.findOne({ where: { domain } }) : null;
            if (existing) {
                repo.merge(existing, args.update);
                return repo.save(existing);
            }
            const created = repo.create({
                ...args.create,
                domain,
                status: args.create.status ?? entities_1.WebsiteStatus.DRAFT,
            });
            return repo.save(created);
        },
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiWebsiteEntity).find({
                relations: ['business'],
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : { createdAt: 'DESC' },
            });
        },
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiWebsiteEntity).findOne({
                where: { id: args.where.id },
                relations: ['business'],
            });
        },
        findFirstByBusinessId: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiWebsiteEntity).findOne({
                where: { businessId: args.businessId },
                relations: ['business'],
                order: { createdAt: 'DESC' },
            });
        },
        update: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiWebsiteEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Website ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
        count: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiWebsiteEntity).count({
                where: args?.where?.status ? { status: args.where.status } : undefined,
            });
        },
    },
    subscription: {
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiSubscriptionEntity).find({
                relations: ['business'],
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : { createdAt: 'DESC' },
            });
        },
        findLatestForBusiness: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiSubscriptionEntity).findOne({
                where: { businessId: args.businessId },
                order: { createdAt: 'DESC' },
            });
        },
        upsertForBusiness: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            const repo = ds.getRepository(entities_1.ApiSubscriptionEntity);
            const existing = await repo.findOne({
                where: { businessId: args.businessId },
                order: { createdAt: 'DESC' },
            });
            if (existing) {
                repo.merge(existing, args.data);
                return repo.save(existing);
            }
            return repo.save(repo.create({ ...args.data, businessId: args.businessId }));
        },
        count: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getApplicationDataSource)());
            return ds.getRepository(entities_1.ApiSubscriptionEntity).count({
                where: args?.where?.status ? { status: args.where.status } : undefined,
            });
        },
    },
    $disconnect: async () => {
        const ds = (0, datasources_1.getApplicationDataSource)();
        if (ds.isInitialized) {
            await ds.destroy();
        }
    },
});
const createAdminClient = () => ({
    adminUser: {
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminUserEntity);
            if (args.where.id) {
                return repo.findOne({ where: { id: args.where.id } });
            }
            if (args.where.email) {
                return repo.findOne({ where: { email: args.where.email } });
            }
            return null;
        },
        findMany: async () => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            return ds.getRepository(entities_1.AdminUserEntity).find({ order: { createdAt: 'DESC' } });
        },
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            return ds.getRepository(entities_1.AdminUserEntity).save(ds.getRepository(entities_1.AdminUserEntity).create(args.data));
        },
        count: async () => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            return ds.getRepository(entities_1.AdminUserEntity).count();
        },
    },
    auditLog: {
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminAuditLogEntity);
            return repo.save(repo.create(args.data));
        },
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            return ds.getRepository(entities_1.AdminAuditLogEntity).find({
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : { createdAt: 'DESC' },
                take: 100,
            });
        },
    },
    template: {
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminTemplateEntity);
            const where = {};
            if (args?.where?.type) {
                where.type = args.where.type;
            }
            if (args?.where?.name?.in?.length) {
                where.name = (0, typeorm_1.In)(args.where.name.in);
            }
            const result = await repo.find({
                where: Object.keys(where).length ? where : undefined,
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : undefined,
            });
            if (!args?.select) {
                return result;
            }
            return result.map((row) => {
                const picked = {};
                for (const [key, enabled] of Object.entries(args.select || {})) {
                    if (enabled) {
                        picked[key] = row[key];
                    }
                }
                return picked;
            });
        },
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminTemplateEntity);
            return repo.findOne({ where: { id: args.where.id } });
        },
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminTemplateEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
        update: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getAdminDataSource)());
            const repo = ds.getRepository(entities_1.AdminTemplateEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Template ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
    },
    $disconnect: async () => {
        const ds = (0, datasources_1.getAdminDataSource)();
        if (ds.isInitialized) {
            await ds.destroy();
        }
    },
});
const createRunnerClient = () => ({
    agentTask: {
        create: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getRunnerDataSource)());
            const repo = ds.getRepository(entities_1.RunnerAgentTaskEntity);
            const entity = repo.create(args.data);
            return repo.save(entity);
        },
        update: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getRunnerDataSource)());
            const repo = ds.getRepository(entities_1.RunnerAgentTaskEntity);
            const existing = await repo.findOne({ where: { id: args.where.id } });
            if (!existing) {
                throw new Error(`Agent task ${args.where.id} not found`);
            }
            repo.merge(existing, args.data);
            return repo.save(existing);
        },
        findUnique: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getRunnerDataSource)());
            const repo = ds.getRepository(entities_1.RunnerAgentTaskEntity);
            return repo.findOne({ where: { id: args.where.id } });
        },
        findMany: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getRunnerDataSource)());
            const repo = ds.getRepository(entities_1.RunnerAgentTaskEntity);
            return repo.find({
                order: args?.orderBy?.createdAt
                    ? { createdAt: resolveOrder(args.orderBy.createdAt) }
                    : undefined,
            });
        },
        count: async (args) => {
            const ds = await ensureDataSourceInitialized((0, datasources_1.getRunnerDataSource)());
            return ds.getRepository(entities_1.RunnerAgentTaskEntity).count({
                where: args?.where?.status ? { status: args.where.status } : undefined,
            });
        },
    },
    $disconnect: async () => {
        const ds = (0, datasources_1.getRunnerDataSource)();
        if (ds.isInitialized) {
            await ds.destroy();
        }
    },
});
exports.applicationDb = createApplicationClient();
exports.adminDb = createAdminClient();
exports.runnerDb = createRunnerClient();
