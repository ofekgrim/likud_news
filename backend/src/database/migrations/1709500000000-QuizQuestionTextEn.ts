import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizQuestionTextEn1709500000000 implements MigrationInterface {
  name = 'QuizQuestionTextEn1709500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD COLUMN IF NOT EXISTS "questionTextEn" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP COLUMN IF EXISTS "questionTextEn"`,
    );
  }
}
