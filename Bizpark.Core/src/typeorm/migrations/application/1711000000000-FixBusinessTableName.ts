import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBusinessTableName1711000000000 implements MigrationInterface {
    name = 'FixBusinessTableName1711000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.APPLICATION_DB_SCHEMA || 'api';

        // Drop the manually-added FK that references the wrong "Business" table
        await queryRunner.query(
            `ALTER TABLE "${schema}"."BusinessUser" DROP CONSTRAINT IF EXISTS "FK_api_BusinessUser_businessId"`,
        );

        // Drop the orphaned "Business" table created by a previous TypeORM sync run
        await queryRunner.query(
            `DROP TABLE IF EXISTS "${schema}"."Business" CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No meaningful rollback — the orphaned table should stay gone
    }
}
