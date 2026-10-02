import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    BrandsModule,
    PrintingtypesModule,
    PrinterfunctiontypesModule,
    EquipmenttypesModule,
    ComputerequipmenttypesModule,
    StoragetypesModule,
    OperatingsystemsModule,
    ComputerprocessorsModule,
    TypenetworksModule,
  ],
  providers: [EquipmentSeedService],
  controllers: [EquipmentSeedController],
  exports: [EquipmentSeedService],
})
export class EquipmentSeedModule {}
