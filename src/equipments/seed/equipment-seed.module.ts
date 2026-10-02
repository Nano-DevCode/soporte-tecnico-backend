import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentSeedService } from './equipment-seed.service';
import { EquipmentSeedController } from './equipment-seed.controller';
import { BrandsModule } from '../brands/brands.module';
import { PrintingtypesModule } from '../hardware/printers/printing-types/printingtypes.module';
import { PrinterfunctiontypesModule } from '../hardware/printers/function-types/printerfunctiontypes.module';
import { EquipmenttypesModule } from '../types/equipmenttypes.module';
import { ComputerequipmenttypesModule } from '../hardware/computers/types/computerequipmenttypes.module';
import { StoragetypesModule } from '../hardware/computers/storage-types/storagetypes.module';
import { OperatingsystemsModule } from '../hardware/computers/operating-systems/operatingsystems.module';
import { ComputerprocessorsModule } from '../hardware/computers/processors/computerprocessors.module';
import { TypenetworksModule } from '../hardware/networks/types/typenetworks.module';
import { ModelsModule } from '../models/models.module';
import { ResponsibleequipmentsModule } from '../responsibles/responsibleequipments.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { EquipmentsModule } from '../equipments.module';
import { Equipment } from '../entities/equipment.entity';
import { Model } from '../models/entities/model.entity';
import { Responsibleequipment } from '../responsibles/entities/responsibleequipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, Model, Responsibleequipment]),
    BrandsModule,
    PrintingtypesModule,
    PrinterfunctiontypesModule,
    EquipmenttypesModule,
    ComputerequipmenttypesModule,
    StoragetypesModule,
    OperatingsystemsModule,
    ComputerprocessorsModule,
    TypenetworksModule,
    ModelsModule,
    ResponsibleequipmentsModule,
    DepartmentsModule,
    EquipmentsModule,
  ],
  providers: [EquipmentSeedService],
  controllers: [EquipmentSeedController],
  exports: [EquipmentSeedService],
})
export class EquipmentSeedModule {}
