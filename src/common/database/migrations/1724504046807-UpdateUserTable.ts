import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import { UserType } from "@entities/user.entity";

export class UpdateUserTable1724504046807 implements MigrationInterface {
    name = 'UpdateUserTable1724504046807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('users', 'type', new TableColumn({
            name: 'type',
            type: 'enum',
            enum: Object.values(UserType), 
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('users', 'type', new TableColumn({
            name: 'type',
            type: 'integer',
            isNullable: true,
        }));
    }
}
