import { PrismaClient, TaskType, TaskStatus } from '@prisma/client';

export * from '@prisma/client';
export * from './common';

// Export a singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
