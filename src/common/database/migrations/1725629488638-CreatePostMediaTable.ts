import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePostMediaTable1725629488638 implements MigrationInterface {
    name = 'CreatePostMediaTable1725629488638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create 'post_media' table
        await queryRunner.createTable(new Table({
            name: 'post_media',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'post_id',
                    type: 'int',
                },
                {
                    name: 'media_url',
                    type: 'varchar',
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);

        // Create foreign key for 'post_id' in 'post_media' table
        await queryRunner.createForeignKey('post_media', new TableForeignKey({
            columnNames: ['post_id'],
            referencedTableName: 'posts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key in 'post_media' table
        const table = await queryRunner.getTable('post_media');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('post_id') !== -1);
        await queryRunner.dropForeignKey('post_media', foreignKey);

        // Drop 'post_media' table
        await queryRunner.dropTable('post_media');
    }

}
