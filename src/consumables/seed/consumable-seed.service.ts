import { Injectable } from '@nestjs/common';
import { SEED_DATA } from './data/consumable';
// import { BrandConsumablesService } from 'src/consumables/brands/brand-consumables.service';
import { TypeconsumablesService } from 'src/consumables/types/typeconsumables.service';
import { UnitMeasurementService } from 'src/consumables/units/unit-measurement.service';
// import { ConsumableUbicationsService } from 'src/consumables/ubications/consumable_ubications.service';
import { MovementTypesService } from 'src/consumables/movements/types/movement_types.service';
import { MovementAplicationsService } from 'src/consumables/movements/applications/movement_aplications.service';

@Injectable()
export class ConsumableSeedService {
  constructor(
    // private readonly brandsconsumableService: BrandConsumablesService,
    private readonly typesconsumablesService: TypeconsumablesService,
    private readonly unitMeasurementService: UnitMeasurementService,
    // private readonly consumableUbicationsService: ConsumableUbicationsService,
    private readonly movementTypesService: MovementTypesService,
    private readonly movementAplicationsService: MovementAplicationsService,
  ) {}

  async RunSeed() {
    // await this.brandsconsumableService.deleteAllBrands();
    await this.typesconsumablesService.deleteAllTypesConsumables();
    await this.unitMeasurementService.deleteAllUnitMeasurements();
    // await this.consumableUbicationsService.deleteAllConsumableUbications();
    await this.movementTypesService.deleteAllMovementTypes();
    await this.movementAplicationsService.deleteAllMovementAplications();

    // for (const brand of SEED_DATA.brands_consumable) {
    //   await this.brandsconsumableService.createSeedBrands(brand);
    // }
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
    // for (const ubication of SEED_DATA.ubication_consumable) {
    //   await this.consumableUbicationsService.createSeedConsumableUbications(
    //     ubication,
    //   );
    // }
    for (const movementType of SEED_DATA.type_movement) {
      await this.movementTypesService.createSeedMovementTypes(movementType);
    }
    for (const movementAplication of SEED_DATA.movement_aplication) {
      await this.movementAplicationsService.createSeedMovementAplications(
        movementAplication,
      );
    }
  }
}
