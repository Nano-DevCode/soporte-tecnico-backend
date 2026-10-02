import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { EquipmentCrudService } from './services/equipment-crud.service';
import { EquipmentQueriesService } from './services/equipment-queries.service';
import { EquipmentStatusService } from './services/equipment-status.service';
import { EquipmentsController } from './equipments.controller';
import { Equipment } from './entities/equipment.entity';

import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { EquipmenttypesModule } from './types/equipmenttypes.module';
import { ResponsibleequipmentsModule } from './responsibles/responsibleequipments.module';
import { ComputersModule } from './hardware/computers/computers.module';
import { PrintersModule } from './hardware/printers/printers.module';
import { NetworksModule } from './hardware/networks/networks.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment]),
    BrandsModule,
    ModelsModule,
    EquipmenttypesModule,
    ResponsibleequipmentsModule,
    ComputersModule,
    PrintersModule,
    NetworksModule,
    DepartmentsModule,
  ],
  controllers: [EquipmentsController],
  providers: [
    EquipmentsService,
    EquipmentCrudService,
    EquipmentQueriesService,
    EquipmentStatusService,
  ],
  exports: [
    EquipmentsService,
    EquipmentCrudService,
    EquipmentQueriesService,
    EquipmentStatusService,
    TypeOrmModule,
    BrandsModule,
    ModelsModule,
    EquipmenttypesModule,
    ResponsibleequipmentsModule,
    ComputersModule,
    PrintersModule,
    NetworksModule,
  ],
})
export class EquipmentsModule {}
