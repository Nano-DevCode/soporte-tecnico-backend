import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787527591688 implements MigrationInterface {
  name = 'InitialSchema1787527591688';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "notificationPreferences" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "notificationPreferences"`,
    );
  }
}
