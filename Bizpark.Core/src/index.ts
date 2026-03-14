export * from './common';
export * from './typeorm';

// Backward-compatible alias for existing imports.
export { applicationDb as prisma } from './typeorm/db-clients';
