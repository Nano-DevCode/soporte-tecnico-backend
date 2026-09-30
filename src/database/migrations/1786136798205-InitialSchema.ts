import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786136798205 implements MigrationInterface {
  name = 'InitialSchema1786136798205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "technical_report_consumables" ("id_technical_report" uuid NOT NULL, "id_consumable" uuid NOT NULL, CONSTRAINT "PK_08e139be2cde71b11eac578dfe1" PRIMARY KEY ("id_technical_report", "id_consumable"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b868be82970ff09d9af1c479b" ON "technical_report_consumables" ("id_technical_report") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_040aad0525fb24e80d58ccec76" ON "technical_report_consumables" ("id_consumable") `,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_consumables" ADD CONSTRAINT "FK_1b868be82970ff09d9af1c479b0" FOREIGN KEY ("id_technical_report") REFERENCES "technical_report"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_consumables" ADD CONSTRAINT "FK_040aad0525fb24e80d58ccec761" FOREIGN KEY ("id_consumable") REFERENCES "consumable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "technical_report_consumables" DROP CONSTRAINT "FK_040aad0525fb24e80d58ccec761"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_consumables" DROP CONSTRAINT "FK_1b868be82970ff09d9af1c479b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_040aad0525fb24e80d58ccec76"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b868be82970ff09d9af1c479b"`,
    );
    await queryRunner.query(`DROP TABLE "technical_report_consumables"`);
  }
}
