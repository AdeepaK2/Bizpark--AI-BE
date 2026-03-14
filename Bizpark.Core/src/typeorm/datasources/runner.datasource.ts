import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RUNNER_ENTITIES } from '../entities/runner';
import { createPostgresDataSourceOptions } from './common';

export const runnerDataSource = new DataSource(
    createPostgresDataSourceOptions({
        name: 'runner',
        urlEnvVar: 'RUNNER_DATABASE_URL',
        schemaEnvVar: 'RUNNER_DB_SCHEMA',
        defaultSchema: 'runner',
        entities: RUNNER_ENTITIES,
        migrationsGlob: `${__dirname}/../migrations/runner/*{.ts,.js}`,
    }),
);

export default runnerDataSource;
