import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePostsTable1725629339532 implements MigrationInterface {
    name = 'CreatePostsTable1725629339532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create 'posts' table
        await queryRunner.createTable(new Table({
            name: 'posts',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'user_id',
                    type: 'int',
                },
                {
                    name: 'integration_id',
                    type: 'int',
                },
                {
                    name: 'content',
                    type: 'text',
                },
                {
                    name: 'status',
                    type: 'varchar',
                },
                {
                    name: 'recurring',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'scheduled',
                    type: 'varchar',
                    isNullable: true,
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

        // Create foreign key for 'user_id' in 'posts' table
        await queryRunner.createForeignKey('posts', new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));

        // Create foreign key for 'integration_id' in 'posts' table
        await queryRunner.createForeignKey('posts', new TableForeignKey({
            columnNames: ['integration_id'],
            referencedTableName: 'integrations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys in 'posts' table
        const table = await queryRunner.getTable('posts');
        const foreignKeys = table.foreignKeys.filter(fk => fk.columnNames.indexOf('user_id') !== -1 || fk.columnNames.indexOf('integration_id') !== -1);
        await queryRunner.dropForeignKeys('posts', foreignKeys);

        // Drop 'posts' table
        await queryRunner.dropTable('posts');
    }

}
