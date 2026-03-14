import { DataSourceOptions } from 'typeorm';
type DataSourceKey = 'application' | 'admin' | 'runner';
type UrlEnvVar = 'APPLICATION_DATABASE_URL' | 'ADMIN_DATABASE_URL' | 'RUNNER_DATABASE_URL';
type SchemaEnvVar = 'APPLICATION_DB_SCHEMA' | 'ADMIN_DB_SCHEMA' | 'RUNNER_DB_SCHEMA';
type CreateOptionsParams = {
    name: DataSourceKey;
    urlEnvVar: UrlEnvVar;
    schemaEnvVar: SchemaEnvVar;
    defaultSchema: string;
    entities: Function[];
    migrationsGlob: string;
};
export declare const createPostgresDataSourceOptions: ({ name, urlEnvVar, schemaEnvVar, defaultSchema, entities, migrationsGlob, }: CreateOptionsParams) => DataSourceOptions;
export {};
