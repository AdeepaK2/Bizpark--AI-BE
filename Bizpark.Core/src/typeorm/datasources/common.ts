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

export const createPostgresDataSourceOptions = ({
    name,
    urlEnvVar,
    schemaEnvVar,
    defaultSchema,
    entities,
    migrationsGlob,
}: CreateOptionsParams): DataSourceOptions => {
    const url = process.env[urlEnvVar] || process.env.DATABASE_URL;
    const schema = process.env[schemaEnvVar] || defaultSchema;

    if (!url) {
        throw new Error(
            `Missing database URL. Set ${urlEnvVar} (or fallback DATABASE_URL) before using the ${name} datasource.`,
        );
    }

    return {
        name,
        type: 'postgres',
        url,
        schema,
        entities,
        migrations: [migrationsGlob],
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true',
        migrationsTableName: 'typeorm_migrations',
    };
};
