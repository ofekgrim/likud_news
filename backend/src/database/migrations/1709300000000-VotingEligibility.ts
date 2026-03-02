import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class VotingEligibility1709300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'voting_eligibility',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'electionId',
            type: 'uuid',
          },
          {
            name: 'approvedBy',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'voting_eligibility',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'app_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'voting_eligibility',
      new TableForeignKey({
        columnNames: ['electionId'],
        referencedTableName: 'primary_elections',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'voting_eligibility',
      new TableUnique({
        columnNames: ['userId', 'electionId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('voting_eligibility');
  }
}
