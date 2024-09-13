import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCronFormatInPostTable1726216435526 implements MigrationInterface {
    name = 'AddCronFormatInPostTable1726216435526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "cronFormat" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "cronFormat"`);
    }
}
