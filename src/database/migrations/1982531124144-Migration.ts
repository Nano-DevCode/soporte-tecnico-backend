import { MigrationInterface, QueryRunner } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// MIGRACIÓN DE DATOS INICIALES
// Inserta: roles, coordinaciones, departamento Departamento de Centro de Cómputo y el SuperAdmin
// ─────────────────────────────────────────────────────────────────────────────

export class Migration1982531124144 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. ROLES ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "role" ("name")
      VALUES
        ('SuperAdmin'),
        ('Jefe CC'),
        ('Coordinador'),
        ('Jefe Departamento'),
        ('Técnico'),
        ('Planeación'),
        ('Secretaria CC'),
        ('Inventario'),
        ('Visitante')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // ── 2. COORDINACIONES ─────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "coordination" ("name")
      VALUES
        ('Infraestructura y Redes'),
        ('Desarrollo de Sistemas'),
        ('Soporte Técnico'),
        ('Sin Coordinación')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // ── 3. DEPARTAMENTO "Departamento de Centro de Cómputo" ───────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department" ("name", "priority", "acronym")
      VALUES ('Departamento de Centro de Cómputo', 1, 'CC')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // ── 4. SUPERADMIN: user + staff ───────────────────────────────────────────
    await queryRunner.query(`
      DO $$
      DECLARE
        v_role_id       UUID;
        v_dept_id       UUID;
        v_coord_id      UUID;
        v_user_id       UUID;
      BEGIN
        SELECT id INTO v_role_id  FROM "role"          WHERE name = 'SuperAdmin'       LIMIT 1;
        SELECT id INTO v_dept_id  FROM "department"    WHERE name = 'Departamento de Centro de Cómputo'        LIMIT 1;
        SELECT id INTO v_coord_id FROM "coordination"  WHERE name = 'Sin Coordinación' LIMIT 1;

        IF NOT EXISTS (SELECT 1 FROM "user" WHERE email = 'no-reply@oaxaca.tecnm.mx') THEN

          -- NOTA: La contraseña DEBE guardarse hasheada.
          -- Si el login te falla, verifica que sepas cuál es la contraseña en 
          -- texto plano que generó este hash de bcrypt.
          INSERT INTO "user" ("email", "password", "status", "roleId")
          VALUES (
            'no-reply@oaxaca.tecnm.mx',
            '$2b$10$BGmNfBi9N7R.RqC/QqoKSe9TJ16p4KeeEzH6tTR9Z69SkfVuGq4Dq',
            true,
            v_role_id
          )
          RETURNING id INTO v_user_id;

          INSERT INTO "staff" (
            "name",
            "paternalSurname",
            "maternalSurname",
            "num_control",
            "rfc",
            "userId",
            "departmentId",
            "coordinationId"
          )
          VALUES (
            'SuperAdmin',
            'Super',
            'Admin',
            '000000',
            'SUPERADMINXXX',
            v_user_id,
            v_dept_id,
            v_coord_id
          );

        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // CORRECCIÓN: El RFC ahora coincide con 'SUPERADMINXXX' (el mismo del método up)
    await queryRunner.query(`
      DELETE FROM "staff" WHERE "rfc" = 'SUPERADMINXXX';
    `);

    await queryRunner.query(`
      DELETE FROM "user" WHERE "email" = 'no-reply@oaxaca.tecnm.mx';
    `);

    await queryRunner.query(`
      DELETE FROM "department" WHERE "name" = 'Departamento de Centro de Cómputo';
    `);

    await queryRunner.query(`
      DELETE FROM "coordination"
      WHERE "name" IN (
        'Infraestructura y Redes',
        'Desarrollo de Sistemas',
        'Soporte Técnico',
        'Sin Coordinación'
      );
    `);

    await queryRunner.query(`
      DELETE FROM "role"
      WHERE "name" IN (
        'SuperAdmin','Jefe CC','Coordinador','Jefe Departamento',
        'Técnico','Planeación','Secretaria CC','Inventario','Visitante'
      );
    `);
  }
}
