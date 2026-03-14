import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';
export * from './common';

type GlobalPrismaClients = {
    applicationPrisma?: PrismaClient;
    adminPrisma?: PrismaClient;
    runnerPrisma?: PrismaClient;
};

const globalForPrisma = global as unknown as GlobalPrismaClients;

const createPrismaClient = (urlEnvVar: 'APPLICATION_DATABASE_URL' | 'ADMIN_DATABASE_URL' | 'RUNNER_DATABASE_URL') => {
    const url = process.env[urlEnvVar] || process.env.DATABASE_URL;
    return new PrismaClient({
        log: ['query'],
        ...(url ? { datasources: { db: { url } } } : {}),
    });
};

export const applicationPrisma =
    globalForPrisma.applicationPrisma || createPrismaClient('APPLICATION_DATABASE_URL');

export const adminPrisma = globalForPrisma.adminPrisma || createPrismaClient('ADMIN_DATABASE_URL');

export const runnerPrisma = globalForPrisma.runnerPrisma || createPrismaClient('RUNNER_DATABASE_URL');

// Backward-compatible alias for existing imports.
export const prisma = applicationPrisma;

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.applicationPrisma = applicationPrisma;
    globalForPrisma.adminPrisma = adminPrisma;
    globalForPrisma.runnerPrisma = runnerPrisma;
}
