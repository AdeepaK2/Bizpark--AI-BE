"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runnerDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const runner_1 = require("../entities/runner");
const common_1 = require("./common");
exports.runnerDataSource = new typeorm_1.DataSource((0, common_1.createPostgresDataSourceOptions)({
    name: 'runner',
    urlEnvVar: 'RUNNER_DATABASE_URL',
    schemaEnvVar: 'RUNNER_DB_SCHEMA',
    defaultSchema: 'runner',
    entities: runner_1.RUNNER_ENTITIES,
    migrationsGlob: `${__dirname}/../migrations/runner/*{.ts,.js}`,
}));
exports.default = exports.runnerDataSource;
