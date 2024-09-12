import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostHistoryTable1726127673650 implements MigrationInterface {
    name = 'CreatePostHistoryTable1726127673650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the post_history table
        await queryRunner.query(`
            CREATE TABLE "post_history" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "status" character varying NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "details" text,
                "post_id" integer NOT NULL,
                CONSTRAINT "PK_6dd0832f4c2ac89b2ede9c4d2ea" PRIMARY KEY ("id"),
                CONSTRAINT "FK_post_history_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the post_history table
        await queryRunner.query(`DROP TABLE "post_history"`);
    }
}
