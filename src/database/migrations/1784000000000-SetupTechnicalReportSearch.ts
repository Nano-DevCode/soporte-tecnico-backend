import { MigrationInterface, QueryRunner } from 'typeorm';

// Cambiamos el número al final de la clase para que TypeORM no se confunda
export class SetupTechnicalReportSearch1784000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_REPORT_SEARCH" 
        ON "technical_report" 
        USING GIN ("textsearchable_index_col");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_REPORT_SEARCH";`);
  }
}
