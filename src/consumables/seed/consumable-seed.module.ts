import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumableSeedService } from './consumable-seed.service';
import { ConsumableSeedController } from './consumable-seed.controller';
import { BrandConsumablesModule } from '../brands/brand-consumables.module';
import { TypeconsumablesModule } from 'src/consumables/types/typeconsumables.module';
import { ConsumableUbicationsModule } from 'src/consumables/ubications/consumable_ubications.module';
import { UnitMeasurementModule } from 'src/consumables/units/unit-measurement.module';
import { MovementTypesModule } from 'src/consumables/movements/types/movement_types.module';
import { MovementAplicationsModule } from 'src/consumables/movements/applications/movement_aplications.module';
import { ConsumablesModule } from '../consumables.module';
import { BatchesproductsModule } from '../batches/batchesproducts.module';
import { Consumable } from '../entities/consumable.entity';
import { Batchesproduct } from '../batches/entities/batchesproduct.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consumable, Batchesproduct]),
    BrandConsumablesModule,
    TypeconsumablesModule,
    UnitMeasurementModule,
    ConsumableUbicationsModule,
    MovementTypesModule,
    MovementAplicationsModule,
    ConsumablesModule,
    BatchesproductsModule,
  ],
  providers: [ConsumableSeedService],
  controllers: [ConsumableSeedController],
  exports: [ConsumableSeedService],
})
export class ConsumableSeedModule {}

