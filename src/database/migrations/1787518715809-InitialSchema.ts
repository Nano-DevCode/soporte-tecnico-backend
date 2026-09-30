import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787518715809 implements MigrationInterface {
  name = 'InitialSchema1787518715809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('GENERAL', 'TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_ROUTED', 'TICKET_REJECTED', 'TICKET_IN_PROGRESS', 'TICKET_SOLVED', 'TICKET_NOT_SOLVED', 'TICKET_FINISHED', 'TICKET_CLOSED', 'INTERVENTION_LOGGED', 'TICKET_UPDATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "title" text NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'GENERAL', "isRead" boolean NOT NULL DEFAULT false, "entityId" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feature_flags" ("id" text NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "category" text NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "badge" text, "iconName" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_db657d344e9caacfc9d5cf8bbac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(`DROP TABLE "feature_flags"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
