export * from './common';
export * from './typeorm';

// Backward-compatible alias for existing imports.
export { applicationPrisma as prisma } from './typeorm/prisma-like-clients';
