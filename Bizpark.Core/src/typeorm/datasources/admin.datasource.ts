import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ADMIN_ENTITIES } from '../entities/admin';
import { createPostgresDataSourceOptions } from './common';

export const adminDataSource = new DataSource(
    createPostgresDataSourceOptions({
        name: 'admin',
        urlEnvVar: 'ADMIN_DATABASE_URL',
        schemaEnvVar: 'ADMIN_DB_SCHEMA',
        defaultSchema: 'admin',
        entities: ADMIN_ENTITIES,
        migrationsGlob: `${__dirname}/../migrations/admin/*{.ts,.js}`,
    }),
);

export default adminDataSource;
