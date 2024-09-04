import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateIntegrationPostTypesTable1725455828808 implements MigrationInterface {
    name = 'CreateIntegrationPostTypesTable1725455828808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
          name: 'integration_posts_types',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'integration_id',
              type: 'int',
            },
            {
              name: 'post_type_id',
              type: 'int',
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
    
        await queryRunner.createForeignKey('integration_posts_types', new TableForeignKey({
          columnNames: ['integration_id'],
          referencedTableName: 'integrations',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }));
    
        await queryRunner.createForeignKey('integration_posts_types', new TableForeignKey({
          columnNames: ['post_type_id'],
          referencedTableName: 'posts_types',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }));
    
        await queryRunner.createIndex('integration_posts_types', new TableIndex({
          name: 'IDX_INTEGRATION_POST_TYPE',
          columnNames: ['integration_id', 'post_type_id'],
        }));
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('integration_posts_types');
        const foreignKeys = table.foreignKeys.filter(fk => fk.columnNames.indexOf('integration_id') !== -1 || fk.columnNames.indexOf('post_type_id') !== -1);
        await queryRunner.dropForeignKeys('integration_posts_types', foreignKeys);
    
        await queryRunner.dropTable('integration_posts_types');
      }

}
