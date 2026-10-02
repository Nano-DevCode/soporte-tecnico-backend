import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { SEED_CONSUMABLES, SEED_DATA } from './data/consumable';
import { BrandConsumablesService } from '../brands/brand-consumables.service';
import { TypeconsumablesService } from 'src/consumables/types/typeconsumables.service';
import { UnitMeasurementService } from 'src/consumables/units/unit-measurement.service';
import { ConsumableUbicationsService } from 'src/consumables/ubications/consumable_ubications.service';
import { MovementTypesService } from 'src/consumables/movements/types/movement_types.service';
import { MovementAplicationsService } from 'src/consumables/movements/applications/movement_aplications.service';
import { ConsumablesCrudService } from '../services/consumables-crud.service';
import { BatchesproductsService } from '../batches/batchesproducts.service';

import { Consumable } from '../entities/consumable.entity';
import { Batchesproduct } from '../batches/entities/batchesproduct.entity';
import { BrandConsumable } from '../brands/entities/brand-consumable.entity';
import { Typeconsumable } from '../types/entities/typeconsumable.entity';
import { UnitMeasurement } from '../units/entities/unit-measurement.entity';
import { ConsumableUbication } from '../ubications/entities/consumable_ubication.entity';

@Injectable()
export class ConsumableSeedService {
  private readonly logger = new Logger(ConsumableSeedService.name);

  constructor(
    @InjectRepository(Consumable)
    private readonly consumableRepository: Repository<Consumable>,
    private readonly brandsconsumableService: BrandConsumablesService,
    private readonly typesconsumablesService: TypeconsumablesService,
    private readonly unitMeasurementService: UnitMeasurementService,
    private readonly consumableUbicationsService: ConsumableUbicationsService,
    private readonly movementTypesService: MovementTypesService,
    private readonly movementAplicationsService: MovementAplicationsService,
    private readonly consumablesCrudService: ConsumablesCrudService,
    private readonly batchesproductsService: BatchesproductsService,
    private readonly dataSource: DataSource,
  ) {}

  async RunSeed() {
    const existingCount = await this.consumableRepository.count();
    const batchRepo = this.dataSource.getRepository(Batchesproduct);
    const existingBatches = await batchRepo.count();

    if (existingCount > 0 && existingBatches > 0) {
      throw new ConflictException(
        'El seed de consumibles ya fue ejecutado anteriormente.',
      );
    }

    if (existingCount === 0) {
      this.logger.log('Iniciando seed de catálogos de consumibles...');
      await this.seedCatalogs();

      this.logger.log('Iniciando seed de artículos consumibles...');
      await this.seedConsumables();
    }

    if (existingBatches === 0) {
      this.logger.log('Iniciando seed de lote inicial de inventario...');
      const allConsumables = await this.consumableRepository.find();
      await this.seedInitialBatch(allConsumables);
    }

    this.logger.log('Seed de consumibles y almacén completado exitosamente.');
    return { message: 'Seed de consumibles ejecutado correctamente' };
  }

  private async seedCatalogs() {
    for (const brand of SEED_DATA.brands_consumable) {
      await this.brandsconsumableService.createSeedBrands(brand);
    }
    for (const typeConsumable of SEED_DATA.type_consumable) {
      await this.typesconsumablesService.createSeedTypesConsumables(
        typeConsumable,
      );
    }
    for (const unitMeasurement of SEED_DATA.unit_measurement) {
      await this.unitMeasurementService.createSeedUnitMeasurements(
        unitMeasurement,
      );
    }
    for (const ubication of SEED_DATA.ubication_consumable) {
      await this.consumableUbicationsService.createSeedConsumableUbications(
        ubication,
      );
    }
    for (const movementType of SEED_DATA.type_movement) {
      await this.movementTypesService.createSeedMovementTypes(movementType);
    }
    for (const movementAplication of SEED_DATA.movement_aplication) {
      await this.movementAplicationsService.createSeedMovementAplications(
        movementAplication,
      );
    }
  }

  private async seedConsumables(): Promise<Consumable[]> {
    const [brands, types, units, ubications] = await Promise.all([
      this.dataSource.getRepository(BrandConsumable).find(),
      this.dataSource.getRepository(Typeconsumable).find(),
      this.dataSource.getRepository(UnitMeasurement).find(),
      this.dataSource.getRepository(ConsumableUbication).find(),
    ]);

    const created: Consumable[] = [];

    for (const item of SEED_CONSUMABLES) {
      const existing = await this.consumableRepository.findOne({
        where: { description: item.description.trim() },
      });
      if (existing) {
        created.push(existing);
        continue;
      }

      const brand = brands.find(
        (b) =>
          b.name?.trim().toLowerCase() === item.brandName.trim().toLowerCase(),
      );
      const type = types.find(
        (t) =>
          t.name?.trim().toLowerCase() === item.typeName.trim().toLowerCase(),
      );
      const unit = units.find(
        (u) =>
          u.name?.trim().toLowerCase() ===
          item.unitMeasurementName.trim().toLowerCase(),
      );
      const ubication = ubications.find(
        (ub) =>
          ub.name?.trim().toLowerCase() ===
          item.ubicationName.trim().toLowerCase(),
      );

      if (!brand || !type || !unit || !ubication) {
        this.logger.warn(
          `No se pudieron resolver todas las relaciones para el consumible: ${item.name}`,
        );
        continue;
      }

      const consumable = await this.consumablesCrudService.create({
        name: item.name,
        description: item.description,
        id_brand_consumable: brand.id,
        id_type_consumable: type.id,
        id_unit_measurement: unit.id,
        id_ubication_consumable: ubication.id,
        number_uses: unit.id === 1 ? item.number_uses : 1,
        stockMin: item.stockMin,
        stockMax: item.stockMax,
      });

      created.push(consumable);
    }

    return created;
  }

  private async seedInitialBatch(consumables: Consumable[]) {
    try {
      const items = consumables.map((consumable) => {
        const seedItem = SEED_CONSUMABLES.find(
          (s) => s.description.trim() === consumable.description.trim(),
        );
        const arrivalAmount = seedItem ? seedItem.initialStock : 10;
        const unitCost = seedItem ? seedItem.unitCost : 100.0;

        return {
          id_consumable: consumable.id,
          arrival_amount: arrivalAmount,
          cost_batch: Math.round(unitCost * arrivalAmount * 100) / 100,
        };
      });

      await this.batchesproductsService.create({
        num_requirement: 'REQ-INIT-2026-001',
        items,
      });
    } catch (error: any) {
      this.logger.warn(
        `No se pudo registrar el lote inicial de consumibles: ${error?.message || error}`,
      );
    }
  }
}

