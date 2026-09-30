import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787173750267 implements MigrationInterface {
  name = 'InitialSchema1787173750267';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "equipment" ADD "num_serial" text`);
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "UQ_86bb91101875f7dcdc29ad45600" UNIQUE ("num_serial")`,
    );
    await queryRunner.query(`ALTER TABLE "consumable" ADD "stockMin" numeric`);
    await queryRunner.query(`ALTER TABLE "consumable" ADD "stockMax" numeric`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "consumable" DROP COLUMN "stockMax"`);
    await queryRunner.query(`ALTER TABLE "consumable" DROP COLUMN "stockMin"`);
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "UQ_86bb91101875f7dcdc29ad45600"`,
    );
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN "num_serial"`);
  }
}
