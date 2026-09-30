import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787670419169 implements MigrationInterface {
  name = 'InitialSchema1787670419169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ticket" ADD "ot_folio" text`);
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "UQ_8fd3ab024c22edc4ba6e593d806" UNIQUE ("ot_folio")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "UQ_8fd3ab024c22edc4ba6e593d806"`,
    );
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "ot_folio"`);
  }
}
