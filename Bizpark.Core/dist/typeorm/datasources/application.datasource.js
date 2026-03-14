"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const api_1 = require("../entities/api");
const common_1 = require("./common");
exports.applicationDataSource = new typeorm_1.DataSource((0, common_1.createPostgresDataSourceOptions)({
    name: 'application',
    urlEnvVar: 'APPLICATION_DATABASE_URL',
    schemaEnvVar: 'APPLICATION_DB_SCHEMA',
    defaultSchema: 'api',
    entities: api_1.API_ENTITIES,
    migrationsGlob: `${__dirname}/../migrations/application/*{.ts,.js}`,
}));
exports.default = exports.applicationDataSource;
