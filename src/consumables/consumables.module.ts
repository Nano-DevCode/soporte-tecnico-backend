import { forwardRef, Module } from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import { ConsumablesController } from './consumables.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumable } from './entities/consumable.entity';
import { TypeconsumablesModule } from 'src/typeconsumables/typeconsumables.module';
import { UnitMeasurementModule } from 'src/unit-measurement/unit-measurement.module';
import { BrandConsumablesModule } from 'src/brand-consumables/brand-consumables.module';
import { BatchesproductsModule } from 'src/batchesproducts/batchesproducts.module';
import { ConsumableUbicationsModule } from 'src/consumable_ubications/consumable_ubications.module';
import { FilesModule } from 'src/files/files.module'; // <-- AGREGADO

@Module({
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  imports: [
    TypeOrmModule.forFeature([Consumable]),
    TypeconsumablesModule,
    UnitMeasurementModule,
    BrandConsumablesModule,
    ConsumableUbicationsModule,
    FilesModule,
    forwardRef(() => BatchesproductsModule),
  ],
  exports: [ConsumablesService, TypeOrmModule],
})
export class ConsumablesModule {}
