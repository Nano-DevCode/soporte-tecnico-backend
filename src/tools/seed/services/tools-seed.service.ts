import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ToolsService } from 'src/tools/services/tools.service';
import { ToolsBrandsService } from 'src/tools/brands/services/tools-brands.service';
import { ToolsModelsService } from 'src/tools/models/services/tools-models.service';
import { ToolsStatusService } from 'src/tools/status/services/tools-status.service';
import { ToolsTypesService } from 'src/tools/types/services/tools-types.service';
import { ToolsInvoicesService } from 'src/tools/invoices/services/tools-invoices.service';
import {
  TOOLS_BRANDS,
  TOOLS_TYPES,
  TOOLS_INVOICES,
  TOOLS_MODELS,
  TOOLS_ITEMS,
} from '../data/tools-seed.data';

@Injectable()
export class ToolsSeedService {
  private readonly logger = new Logger(ToolsSeedService.name);

  constructor(
    private readonly toolsService: ToolsService,
    private readonly toolsBrandsService: ToolsBrandsService,
    private readonly toolsModelsService: ToolsModelsService,
    private readonly toolsStatusService: ToolsStatusService,
    private readonly toolsTypesService: ToolsTypesService,
    private readonly toolsInvoicesService: ToolsInvoicesService,
  ) {}

  async runSeed() {
    const existingTools = await this.toolsService.findAll({
      limit: 1,
      offset: 0,
    });

    if (existingTools.meta.total > 0) {
      throw new ConflictException(
        'El seed de herramientas ya fue ejecutado anteriormente.',
      );
    }

    // 1. Estados
    const statusMap = await this.seedStatuses();

    // 2. Tipos de herramientas
    const typeMap = await this.seedTypes();

    // 3. Facturas
    const invoiceMap = await this.seedInvoices();

    // 4. Marcas
    const brandMap = await this.seedBrands();

    // 5. Modelos
    const modelMap = await this.seedModels(brandMap);

    // 6. Herramientas principales
    let createdCount = 0;
    for (const item of TOOLS_ITEMS) {
      const statusId = statusMap.get(item.statusName.toLowerCase());
      const typeId = typeMap.get(item.typeName.toLowerCase());
      const modelId = modelMap.get(item.modelName.toLowerCase());
      const invoiceId = item.invoiceInternal
        ? invoiceMap.get(item.invoiceInternal.toLowerCase())
        : undefined;

      if (!statusId || !typeId || !modelId) {
        this.logger.warn(
          `Omitiendo herramienta '${item.name}' por falta de relaciones (status: ${statusId}, type: ${typeId}, model: ${modelId})`,
        );
        continue;
      }

      await this.toolsService.create({
        name: item.name,
        idInventary: item.idInventary,
        description: item.description,
        statusId,
        typeId,
        modelId,
        invoiceId,
        observations: item.observations,
      });
      createdCount++;
    }

    this.logger.log(
      `Seed de herramientas completado exitosamente: ${createdCount} herramientas creadas.`,
    );

    return {
      message: 'Seed de herramientas ejecutado correctamente',
      totalToolsCreated: createdCount,
    };
  }

  private async seedStatuses(): Promise<Map<string, string>> {
    const existing = await this.toolsStatusService.findAll();
    if (!existing.toolsStatus || existing.toolsStatus.length === 0) {
      await this.toolsStatusService.seed();
    }
    const updated = await this.toolsStatusService.findAll();
    const map = new Map<string, string>();
    for (const s of updated.toolsStatus) {
      map.set(s.name.toLowerCase(), s.id);
    }
    return map;
  }

  private async seedTypes(): Promise<Map<string, string>> {
    const existing = await this.toolsTypesService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const t of existing.toolsTypes) {
      map.set(t.name.toLowerCase(), t.id);
    }

    for (const typeName of TOOLS_TYPES) {
      if (!map.has(typeName.toLowerCase())) {
        const created = await this.toolsTypesService.create({
          name: typeName,
        });
        if (created?.id) {
          map.set(typeName.toLowerCase(), created.id);
        }
      }
    }
    return map;
  }

  private async seedInvoices(): Promise<Map<string, string>> {
    const existing = await this.toolsInvoicesService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const inv of existing.toolsInvoices) {
      map.set(inv.idInternal.toLowerCase(), inv.id);
    }

    for (const invId of TOOLS_INVOICES) {
      if (!map.has(invId.toLowerCase())) {
        const created = await this.toolsInvoicesService.create({
          idInternal: invId,
        });
        if (created?.id) {
          map.set(invId.toLowerCase(), created.id);
        }
      }
    }
    return map;
  }

  private async seedBrands(): Promise<Map<string, string>> {
    const existing = await this.toolsBrandsService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const b of existing.toolsBrands) {
      map.set(b.name.toLowerCase(), b.id);
    }

    for (const brandName of TOOLS_BRANDS) {
      if (!map.has(brandName.toLowerCase())) {
        const created = await this.toolsBrandsService.create({
          name: brandName,
        });
        if (created?.id) {
          map.set(brandName.toLowerCase(), created.id);
        }
      }
    }
    return map;
  }

  private async seedModels(
    brandMap: Map<string, string>,
  ): Promise<Map<string, string>> {
    const existing = await this.toolsModelsService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const m of existing.toolsModels) {
      map.set(m.name.toLowerCase(), m.id);
    }

    for (const model of TOOLS_MODELS) {
      if (!map.has(model.name.toLowerCase())) {
        const brandId = brandMap.get(model.brandName.toLowerCase());
        if (brandId) {
          const created = await this.toolsModelsService.create({
            name: model.name,
            brandId,
          });
          if (created?.id) {
            map.set(model.name.toLowerCase(), created.id);
          }
        }
      }
    }
    return map;
  }
}
