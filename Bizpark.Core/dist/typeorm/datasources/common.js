"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresDataSourceOptions = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
let hasAttemptedEnvLoad = false;
const parseEnvLine = (line) => {
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
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }
    return { key, value };
};
const loadEnvFromFileIfNeeded = () => {
    if (hasAttemptedEnvLoad) {
        return;
    }
    hasAttemptedEnvLoad = true;
    const envFile = process.env.BIZPARK_ENV_FILE || node_path_1.default.resolve(__dirname, '../../../.env');
    if (!node_fs_1.default.existsSync(envFile)) {
        return;
    }
    const content = node_fs_1.default.readFileSync(envFile, 'utf8');
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
const createPostgresDataSourceOptions = ({ name, urlEnvVar, schemaEnvVar, defaultSchema, entities, migrationsGlob, }) => {
    loadEnvFromFileIfNeeded();
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
