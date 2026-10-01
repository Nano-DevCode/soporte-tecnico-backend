import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketSlaTable1982531124145 implements MigrationInterface {
  name = 'CreateTicketSlaTable1982531124145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_sla_slastatus_enum') THEN
          CREATE TYPE "public"."ticket_sla_slastatus_enum" AS ENUM('ON_TRACK', 'AT_RISK', 'BREACHED', 'COMPLIANT');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_sla" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "priority" integer NOT NULL DEFAULT 4,
        "maxResolutionHours" numeric(8,2) NOT NULL DEFAULT '24.00',
        "maxResponseHours" numeric(8,2) NOT NULL DEFAULT '4.00',
        "slaStatus" "public"."ticket_sla_slastatus_enum" NOT NULL DEFAULT 'ON_TRACK',
        "percentageConsumed" numeric(6,2) NOT NULL DEFAULT '0.00',
        "warningAlertSentAt" TIMESTAMP WITH TIME ZONE,
        "breachedAlertSentAt" TIMESTAMP WITH TIME ZONE,
        "firstRespondedAt" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "REL_ticket_sla_ticketId" UNIQUE ("ticketId"),
        CONSTRAINT "PK_ticket_sla_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ticket_sla_ticketId" ON "ticket_sla" ("ticketId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ticket_sla_slaStatus" ON "ticket_sla" ("slaStatus");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_ticket_sla_ticket'
        ) THEN
          ALTER TABLE "ticket_sla"
            ADD CONSTRAINT "FK_ticket_sla_ticket"
            FOREIGN KEY ("ticketId")
            REFERENCES "ticket"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ticket_sla" DROP CONSTRAINT IF EXISTS "FK_ticket_sla_ticket";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ticket_sla_slaStatus";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ticket_sla_ticketId";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "ticket_sla";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."ticket_sla_slastatus_enum";
    `);
  }
}
