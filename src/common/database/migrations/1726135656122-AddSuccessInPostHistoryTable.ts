import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuccessInPostHistoryTable1726135656122 implements MigrationInterface {
    name = 'AddSuccessInPostHistoryTable1726135656122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_history" ADD "success" boolean NOT NULL DEFAULT false`);
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_history" DROP COLUMN "success"`);
      }

}
