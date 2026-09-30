import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstallUnaccentExtension1773326272661 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Instalamos la extensión para ignorar acentos
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertimos: Eliminamos la extensión
    await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent";`);
  }
}
