import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUser1724234821427 implements MigrationInterface {
    name = 'AddUser1724234821427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL PRIMARY KEY,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "password" character varying,
                "type" integer,
                "verified" boolean NOT NULL DEFAULT false,
                "googleid" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP
            )
        `);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
