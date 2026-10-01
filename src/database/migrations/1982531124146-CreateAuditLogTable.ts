import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable1982531124146 implements MigrationInterface {
  name = 'CreateAuditLogTable1982531124146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_log_action_enum') THEN
          CREATE TYPE "public"."audit_log_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entityName" character varying(100) NOT NULL,
        "entityId" character varying(100) NOT NULL,
        "action" "public"."audit_log_action_enum" NOT NULL DEFAULT 'CREATE',
        "performedBy" character varying(100),
        "performedByEmail" character varying(150),
        "ipAddress" character varying(50),
        "userAgent" text,
        "requestId" character varying(100),
        "previousValues" jsonb,
        "newValues" jsonb,
        "changedFields" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity" ON "audit_log" ("entityName", "entityId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_entityName" ON "audit_log" ("entityName");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_entityId" ON "audit_log" ("entityId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_performedBy" ON "audit_log" ("performedBy");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_requestId" ON "audit_log" ("requestId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_createdAt" ON "audit_log" ("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_createdAt";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_requestId";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_performedBy";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_action";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_entityId";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_entityName";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_audit_log_entity";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "audit_log";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."audit_log_action_enum";
    `);
  }
}
