import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { API_ENTITIES } from '../entities/api';
import { createPostgresDataSourceOptions } from './common';

export const applicationDataSource = new DataSource(
    createPostgresDataSourceOptions({
        name: 'application',
        urlEnvVar: 'APPLICATION_DATABASE_URL',
        schemaEnvVar: 'APPLICATION_DB_SCHEMA',
        defaultSchema: 'api',
        entities: API_ENTITIES,
        migrationsGlob: `${__dirname}/../migrations/application/*{.ts,.js}`,
    }),
);

export default applicationDataSource;
