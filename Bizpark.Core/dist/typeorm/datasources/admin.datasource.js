"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const admin_1 = require("../entities/admin");
const common_1 = require("./common");
let adminDataSource = null;
const getAdminDataSource = () => {
    if (!adminDataSource) {
        adminDataSource = new typeorm_1.DataSource((0, common_1.createPostgresDataSourceOptions)({
            name: 'admin',
            urlEnvVar: 'ADMIN_DATABASE_URL',
            schemaEnvVar: 'ADMIN_DB_SCHEMA',
            defaultSchema: 'public',
            entities: admin_1.ADMIN_ENTITIES,
            migrationsGlob: `${__dirname}/../migrations/admin/*{.ts,.js}`,
        }));
    }
    return adminDataSource;
};
exports.getAdminDataSource = getAdminDataSource;
