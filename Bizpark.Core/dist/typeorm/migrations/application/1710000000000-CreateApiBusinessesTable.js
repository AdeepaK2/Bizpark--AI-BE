"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateApiBusinessesTable1710000000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateApiBusinessesTable1710000000000 {
    constructor() {
        this.name = 'CreateApiBusinessesTable1710000000000';
    }
    async up(queryRunner) {
        const schema = process.env.APPLICATION_DB_SCHEMA || 'api';
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        await queryRunner.createTable(new typeorm_1.Table({
            schema,
            name: 'businesses',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isNullable: false,
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'category',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'logoUrl',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'subscriptionTier',
                    type: 'enum',
                    enumName: 'business_subscription_tier_enum',
                    enum: ['FREE', 'PRO', 'AGENCY'],
                    default: "'FREE'",
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamptz',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
                {
                    name: 'updatedAt',
                    type: 'timestamptz',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
            ],
        }), true);
    }
    async down(queryRunner) {
        const schema = process.env.APPLICATION_DB_SCHEMA || 'api';
        await queryRunner.dropTable(`${schema}.businesses`);
        await queryRunner.query(`DROP TYPE IF EXISTS "${schema}"."business_subscription_tier_enum"`);
    }
}
exports.CreateApiBusinessesTable1710000000000 = CreateApiBusinessesTable1710000000000;
