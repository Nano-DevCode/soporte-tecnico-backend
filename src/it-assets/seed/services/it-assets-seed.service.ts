import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ItAssetsService } from 'src/it-assets/services/it-assets.service';
import { ItAssetsBrandsService } from 'src/it-assets/brands/services/it-assets-brands.service';
import { ItAssetsModelsService } from 'src/it-assets/models/services/it-assets-models.service';
import { ItAssetsStatusService } from 'src/it-assets/status/services/it-assets-status.service';
import { ItAssetsTypesService } from 'src/it-assets/types/services/it-assets-types.service';
import { ItAssetsInvoicesService } from 'src/it-assets/invoices/services/it-assets-invoices.service';
import {
  IT_ASSETS_BRANDS,
  IT_ASSETS_TYPES,
  IT_ASSETS_INVOICES,
  IT_ASSETS_MODELS,
  IT_ASSETS_ITEMS,
} from '../data/it-assets-seed.data';

@Injectable()
export class ItAssetsSeedService {
  private readonly logger = new Logger(ItAssetsSeedService.name);

  constructor(
    private readonly itAssetsService: ItAssetsService,
    private readonly itAssetsBrandsService: ItAssetsBrandsService,
    private readonly itAssetsModelsService: ItAssetsModelsService,
    private readonly itAssetsStatusService: ItAssetsStatusService,
    private readonly itAssetsTypesService: ItAssetsTypesService,
    private readonly itAssetsInvoicesService: ItAssetsInvoicesService,
  ) {}

  async runSeed() {
    const existingAssets = await this.itAssetsService.findAll({
      limit: 1,
      offset: 0,
    });

    if (existingAssets.meta.total > 0) {
      throw new ConflictException(
        'El seed de activos de TI ya fue ejecutado anteriormente.',
      );
    }

    // 1. Estados
    const statusMap = await this.seedStatuses();

    // 2. Tipos de activo
    const typeMap = await this.seedTypes();

    // 3. Facturas
    const invoiceMap = await this.seedInvoices();

    // 4. Marcas
    const brandMap = await this.seedBrands();

    // 5. Modelos
    const modelMap = await this.seedModels(brandMap);

    // 6. Activos principales
    let createdCount = 0;
    for (const item of IT_ASSETS_ITEMS) {
      const statusId = statusMap.get(item.statusName.toLowerCase());
      const typeId = typeMap.get(item.typeName.toLowerCase());
      const modelId = modelMap.get(item.modelName.toLowerCase());
      const invoiceId = item.invoiceInternal
        ? invoiceMap.get(item.invoiceInternal.toLowerCase())
        : undefined;

      if (!statusId || !typeId || !modelId) {
        this.logger.warn(
          `Omitiendo activo '${item.name}' por falta de relaciones (status: ${statusId}, type: ${typeId}, model: ${modelId})`,
        );
        continue;
      }

      await this.itAssetsService.create({
        name: item.name,
        idInventary: item.idInventary,
        serialNumber: item.serialNumber,
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
      `Seed de activos de TI completado exitosamente: ${createdCount} activos creados.`,
    );

    return {
      message: 'Seed de activos de TI ejecutado correctamente',
      totalAssetsCreated: createdCount,
    };
  }

  private async seedStatuses(): Promise<Map<string, string>> {
    const existing = await this.itAssetsStatusService.findAll();
    if (!existing.itAssetsStatus || existing.itAssetsStatus.length === 0) {
      await this.itAssetsStatusService.seed();
    }
    const updated = await this.itAssetsStatusService.findAll();
    const map = new Map<string, string>();
    for (const s of updated.itAssetsStatus) {
      map.set(s.name.toLowerCase(), s.id);
    }
    return map;
  }

  private async seedTypes(): Promise<Map<string, string>> {
    const existing = await this.itAssetsTypesService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const t of existing.itAssetsTypes) {
      map.set(t.name.toLowerCase(), t.id);
    }

    for (const typeName of IT_ASSETS_TYPES) {
      if (!map.has(typeName.toLowerCase())) {
        const created = await this.itAssetsTypesService.create({
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
    const existing = await this.itAssetsInvoicesService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const inv of existing.itAssetsInvoices) {
      map.set(inv.idInternal.toLowerCase(), inv.id);
    }

    for (const invId of IT_ASSETS_INVOICES) {
      if (!map.has(invId.toLowerCase())) {
        const created = await this.itAssetsInvoicesService.create({
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
    const existing = await this.itAssetsBrandsService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const b of existing.itAssetsBrands) {
      map.set(b.name.toLowerCase(), b.id);
    }

    for (const brandName of IT_ASSETS_BRANDS) {
      if (!map.has(brandName.toLowerCase())) {
        const created = await this.itAssetsBrandsService.create({
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
    const existing = await this.itAssetsModelsService.findAll({
      limit: 100,
      offset: 0,
    });
    const map = new Map<string, string>();
    for (const m of existing.itAssetsModels) {
      map.set(m.name.toLowerCase(), m.id);
    }

    for (const model of IT_ASSETS_MODELS) {
      if (!map.has(model.name.toLowerCase())) {
        const brandId = brandMap.get(model.brandName.toLowerCase());
        if (brandId) {
          const created = await this.itAssetsModelsService.create({
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
