import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUserIntegrationTable1724405004018 implements MigrationInterface {
  name = 'CreateUserIntegrationTable1724405004018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_integrations',
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
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
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
      }),
    );

    await queryRunner.createForeignKey(
      'user_integrations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_integrations',
      new TableForeignKey({
        columnNames: ['integration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'integrations',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_integrations');
    const foreignKeyUser = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    const foreignKeyIntegration = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('integration_id') !== -1,
    );

    await queryRunner.dropForeignKey('user_integrations', foreignKeyUser);
    await queryRunner.dropForeignKey('user_integrations', foreignKeyIntegration);
    await queryRunner.dropTable('user_integrations');
  }
}
