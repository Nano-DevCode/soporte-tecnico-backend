import { forwardRef, Module } from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import { ConsumablesController } from './consumables.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumable } from './entities/consumable.entity';
import { Batchesproduct } from './batches/entities/batchesproduct.entity';
import { Typeconsumable } from './types/entities/typeconsumable.entity';
import { UnitMeasurement } from './units/entities/unit-measurement.entity';
import { BrandConsumable } from './brands/entities/brand-consumable.entity';
import { ConsumableUbication } from './ubications/entities/consumable_ubication.entity';
import { TypeconsumablesModule } from './types/typeconsumables.module';
import { UnitMeasurementModule } from './units/unit-measurement.module';
import { BrandConsumablesModule } from './brands/brand-consumables.module';
import { BatchesproductsModule } from './batches/batchesproducts.module';
import { ConsumableUbicationsModule } from './ubications/consumable_ubications.module';
import { ConsumableMovementsModule } from './movements/consumable-movements.module';
import { MovementTypesModule } from './movements/types/movement_types.module';
import { MovementAplicationsModule } from './movements/applications/movement_aplications.module';
import { FilesModule } from 'src/files/files.module';
import { ConsumablesCrudService } from './services/consumables-crud.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consumable,
      Batchesproduct,
      Typeconsumable,
      UnitMeasurement,
      BrandConsumable,
      ConsumableUbication,
    ]),
    TypeconsumablesModule,
    UnitMeasurementModule,
    BrandConsumablesModule,
    ConsumableUbicationsModule,
    FilesModule,
    forwardRef(() => BatchesproductsModule),
    forwardRef(() => ConsumableMovementsModule),
    MovementTypesModule,
    MovementAplicationsModule,
  ],
  controllers: [ConsumablesController],
  providers: [ConsumablesService, ConsumablesCrudService],
  exports: [
    ConsumablesService,
    ConsumablesCrudService,
    TypeOrmModule,
    TypeconsumablesModule,
    UnitMeasurementModule,
    BrandConsumablesModule,
    ConsumableUbicationsModule,
    MovementTypesModule,
    MovementAplicationsModule,
  ],
})
export class ConsumablesModule {}

