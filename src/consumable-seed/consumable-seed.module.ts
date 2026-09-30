import { Module } from '@nestjs/common';
import { ConsumableSeedService } from './consumable-seed.service';
import { ConsumableSeedController } from './consumable-seed.controller';
// import { BrandConsumablesModule } from '../brand-consumables/brand-consumables.module';
import { TypeconsumablesModule } from 'src/typeconsumables/typeconsumables.module';
// import { ConsumableUbicationsModule } from 'src/consumable_ubications/consumable_ubications.module';
import { UnitMeasurementModule } from 'src/unit-measurement/unit-measurement.module';
import { MovementTypesModule } from 'src/movement_types/movement_types.module';
import { MovementAplicationsModule } from 'src/movement_aplications/movement_aplications.module';

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
