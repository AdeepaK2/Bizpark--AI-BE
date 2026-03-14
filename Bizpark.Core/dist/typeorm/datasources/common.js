"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresDataSourceOptions = void 0;
const createPostgresDataSourceOptions = ({ name, urlEnvVar, schemaEnvVar, defaultSchema, entities, migrationsGlob, }) => {
    const url = process.env[urlEnvVar] || process.env.DATABASE_URL;
    const schema = process.env[schemaEnvVar] || defaultSchema;
    if (!url) {
        throw new Error(`Missing database URL. Set ${urlEnvVar} (or fallback DATABASE_URL) before using the ${name} datasource.`);
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
exports.createPostgresDataSourceOptions = createPostgresDataSourceOptions;
