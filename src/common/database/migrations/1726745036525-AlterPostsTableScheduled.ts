import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPostsTableScheduled1726745036525 implements MigrationInterface {
    name = 'AlterPostsTableScheduled1726745036525';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE posts
            ALTER COLUMN "scheduled" TYPE TIMESTAMP WITH TIME ZONE
            USING ("scheduled"::TIMESTAMP AT TIME ZONE 'UTC');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE posts
            ALTER COLUMN "scheduled" TYPE TIMESTAMP
            USING ("scheduled"::TIMESTAMP);
        `);
    }
}
