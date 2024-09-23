import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPostsTableAddPostType1727071055841 implements MigrationInterface {
    name = 'AlterPostsTableAddPostType1727071055841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN "postType" VARCHAR DEFAULT 'text'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "postType"`);
    }

}
