import { DataSourceOptions } from 'typeorm';
import fs from 'node:fs';
import path from 'node:path';

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

let hasAttemptedEnvLoad = false;

const parseEnvLine = (line: string): { key: string; value: string } | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        return null;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) {
        return null;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (!key) {
        return null;
    }

    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1);
    }

    return { key, value };
};

const loadEnvFromFileIfNeeded = () => {
    if (hasAttemptedEnvLoad) {
        return;
    }
    hasAttemptedEnvLoad = true;

    const envFile =
        process.env.BIZPARK_ENV_FILE || path.resolve(__dirname, '../../../.env');

    if (!fs.existsSync(envFile)) {
        return;
    }

    const content = fs.readFileSync(envFile, 'utf8');
    for (const rawLine of content.split('\n')) {
        const parsed = parseEnvLine(rawLine);
        if (!parsed) {
            continue;
        }

        if (process.env[parsed.key] === undefined) {
            process.env[parsed.key] = parsed.value;
        }
    }
};

export const createPostgresDataSourceOptions = ({
    name,
    urlEnvVar,
    schemaEnvVar,
    defaultSchema,
    entities,
    migrationsGlob,
}: CreateOptionsParams): DataSourceOptions => {
    loadEnvFromFileIfNeeded();

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
