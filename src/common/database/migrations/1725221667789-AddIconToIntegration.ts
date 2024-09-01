import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIconToIntegration1725221667789 implements MigrationInterface {
    name = 'AddIconToIntegration1725221667789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integrations" ADD "icon" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integrations" DROP COLUMN "icon"`);
    }

}
