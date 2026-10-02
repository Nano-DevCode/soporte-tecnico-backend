import { Module } from '@nestjs/common';
import { ConsumableSeedService } from './consumable-seed.service';
import { ConsumableSeedController } from './consumable-seed.controller';
// import { BrandConsumablesModule } from '../brand-consumables/brand-consumables.module';
import { TypeconsumablesModule } from 'src/consumables/types/typeconsumables.module';
// import { ConsumableUbicationsModule } from 'src/consumables/ubications/consumable_ubications.module';
import { UnitMeasurementModule } from 'src/consumables/units/unit-measurement.module';
import { MovementTypesModule } from 'src/consumables/movements/types/movement_types.module';
import { MovementAplicationsModule } from 'src/consumables/movements/applications/movement_aplications.module';

@Module({
  imports: [
    // BrandConsumablesModule,
    TypeconsumablesModule,
    UnitMeasurementModule,
    // ConsumableUbicationsModule,
    MovementTypesModule,
    MovementAplicationsModule,
  ],
  providers: [ConsumableSeedService],
  controllers: [ConsumableSeedController],
})
export class ConsumableSeedModule {}
