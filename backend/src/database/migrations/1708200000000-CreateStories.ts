import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStories1708200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '2000',
          },
          {
            name: 'thumbnailUrl',
            type: 'varchar',
            length: '2000',
            isNullable: true,
          },
          {
            name: 'linkUrl',
            type: 'varchar',
            length: '2000',
            isNullable: true,
          },
          {
            name: 'articleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'stories',
      new TableIndex({
        name: 'idx_stories_sort',
        columnNames: ['sortOrder'],
      }),
    );

    await queryRunner.createIndex(
      'stories',
      new TableIndex({
        name: 'idx_stories_active',
        columnNames: ['isActive', 'sortOrder'],
      }),
    );

    await queryRunner.createForeignKey(
      'stories',
      new TableForeignKey({
        name: 'fk_stories_article',
        columnNames: ['articleId'],
        referencedTableName: 'articles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('stories', 'fk_stories_article');
    await queryRunner.dropIndex('stories', 'idx_stories_active');
    await queryRunner.dropIndex('stories', 'idx_stories_sort');
    await queryRunner.dropTable('stories');
  }
}
