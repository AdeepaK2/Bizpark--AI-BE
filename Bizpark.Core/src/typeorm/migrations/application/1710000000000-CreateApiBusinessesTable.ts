import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateApiBusinessesTable1710000000000 implements MigrationInterface {
    name = 'CreateApiBusinessesTable1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.APPLICATION_DB_SCHEMA || 'api';

        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

        await queryRunner.createTable(
            new Table({
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
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.APPLICATION_DB_SCHEMA || 'api';

        await queryRunner.dropTable(`${schema}.businesses`);
        await queryRunner.query(`DROP TYPE IF EXISTS "${schema}"."business_subscription_tier_enum"`);
    }
}
