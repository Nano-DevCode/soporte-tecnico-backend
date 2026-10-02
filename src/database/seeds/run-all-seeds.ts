import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { RoleSeedService } from 'src/auth/roles/seed/role-seed.service';
import { CoordinationSeedService } from 'src/coordinations/seed/coordination-seed.service';
import { DepartmentSeedService } from 'src/departments/seed/department-seed.service';
import { UserSeedService } from 'src/users/seed/user-seed.service';
import { CatalogSeedService } from 'src/catalog-seed/catalog-seed.service';
import { EquipmentSeedService } from 'src/equipment-seed/equipment-seed.service';
import { FeatureFlagsSeedService } from 'src/feature-flags-seed/feature-flags-seed.service';
import { ConsumableSeedService } from 'src/consumables/seed/consumable-seed.service';
import { ItAssetsSeedService } from 'src/it-assets/seed/services/it-assets-seed.service';
import { ToolsSeedService } from 'src/tools/seed/services/tools-seed.service';
import { TicketsSeedService } from 'src/tickets/seed/services/tickets-seed.service';

async function bootstrap() {
  const logger = new Logger('SeedRunner');
  logger.log('Iniciando contexto de aplicación para ejecución de seeds...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const runStep = async (name: string, fn: () => Promise<unknown>) => {
    logger.log(`---> [SEED] Iniciando: ${name}...`);
    try {
      const result = await fn();
      logger.log(
        `✓ [SEED] ${name} completado con éxito. Resultado: ${JSON.stringify(result ?? 'OK')}`,
      );
    } catch (error: any) {
      if (error?.status === 409 || error?.name === 'ConflictException') {
        logger.warn(
          `⚠ [SEED] ${name} omitido: Ya se encontraba ejecutado previamente.`,
        );
      } else {
        logger.error(
          `✗ [SEED] Error ejecutando ${name}:`,
          error?.message || error,
        );
        throw error;
      }
    }
  };

  try {
    // 1. Roles del sistema
    const roleSeed = app.get(RoleSeedService);
    await runStep('Roles', () => roleSeed.runSeed());

    // 2. Coordinaciones institucionales
    const coordSeed = app.get(CoordinationSeedService);
    await runStep('Coordinaciones', () => coordSeed.runSeed());

    // 3. Departamentos institucionales
    const deptSeed = app.get(DepartmentSeedService);
    await runStep('Departamentos', () => deptSeed.runSeed());

    // 4. Usuarios y Personal (Staff)
    const userSeed = app.get(UserSeedService);
    await runStep('Usuarios y Personal', () => userSeed.runSeed());

    // 5. Catálogos generales (estados, tipos de problema, tipos de documento, tipos de mant., validez de fallas)
    const catalogSeed = app.get(CatalogSeedService);
    await runStep('Catálogos Generales', () => catalogSeed.runSeed());
    await runStep('Validez de Fallas', () =>
      catalogSeed.runSeedFaultValidities(),
    );

    // 6. Equipos de cómputo y periféricos
    const equipSeed = app.get(EquipmentSeedService);
    await runStep('Catálogos de Equipos', () => equipSeed.RunSeed());

    // 7. Consumibles y almacén
    const consumableSeed = app.get(ConsumableSeedService);
    await runStep('Consumibles', () => consumableSeed.RunSeed());

    // 8. Feature Flags
    const featureFlagsSeed = app.get(FeatureFlagsSeedService);
    await runStep('Feature Flags', () => featureFlagsSeed.runSeed());

    // 9. Activos de TI (IT Assets)
    const itAssetsSeed = app.get(ItAssetsSeedService);
    await runStep('Activos de TI', () => itAssetsSeed.runSeed());

    // 10. Herramientas (Tools)
    const toolsSeed = app.get(ToolsSeedService);
    await runStep('Herramientas', () => toolsSeed.runSeed());

    // 11. Tickets de soporte técnico
    const ticketsSeed = app.get(TicketsSeedService);
    await runStep('Tickets de Soporte', () => ticketsSeed.runSeed());

    logger.log('====================================================');
    logger.log('¡TODOS LOS SEEDERS HAN SIDO EJECUTADOS EXITOSAMENTE!');
    logger.log('====================================================');
  } catch (error) {
    logger.error('Fallo en la secuencia de seeds. Proceso abortado.', error);
    process.exit(1);
  } finally {
    try {
      await app.close();
    } catch {
      // Ignorar error de parada de bot de Telegraf u otros hooks en contexto standalone
    }
  }
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error in seed bootstrap:', err);
    process.exit(1);
  });
