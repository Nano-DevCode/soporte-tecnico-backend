import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787950083342 implements MigrationInterface {
  name = 'InitialSchema1787950083342';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "technician_kpis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_assigned" integer NOT NULL DEFAULT '0', "total_resolved" integer NOT NULL DEFAULT '0', "pending_tickets" integer NOT NULL DEFAULT '0', "effectiveness_rate" numeric(5,2) NOT NULL DEFAULT '0', "avg_resolution_hours" numeric(10,2) NOT NULL DEFAULT '0', "staffId" uuid NOT NULL, "last_calculated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_f47e03bff9035d36d20c5bd364" UNIQUE ("staffId"), CONSTRAINT "PK_9bb7d5759f9f8a4a5d677225872" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f47e03bff9035d36d20c5bd364" ON "technician_kpis" ("staffId") `,
    );
    await queryRunner.query(`ALTER TABLE "staff" ADD "searchField" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c3c7ffe4b9fa7072fc924a0636" ON "staff" ("searchField") `,
    );
    await queryRunner.query(
      `ALTER TABLE "technician_kpis" ADD CONSTRAINT "FK_f47e03bff9035d36d20c5bd3641" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "technician_kpis" DROP CONSTRAINT "FK_f47e03bff9035d36d20c5bd3641"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3c7ffe4b9fa7072fc924a0636"`,
    );
    await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "searchField"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f47e03bff9035d36d20c5bd364"`,
    );
    await queryRunner.query(`DROP TABLE "technician_kpis"`);
  }
}
