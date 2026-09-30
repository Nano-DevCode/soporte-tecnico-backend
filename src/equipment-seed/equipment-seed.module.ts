import { Module } from '@nestjs/common';
import { EquipmentSeedService } from './equipment-seed.service';
import { EquipmentSeedController } from './equipment-seed.controller';
import { BrandsModule } from 'src/brands/brands.module';
import { PrintingtypesModule } from 'src/printingtypes/printingtypes.module';
import { PrinterfunctiontypesModule } from 'src/printerfunctiontypes/printerfunctiontypes.module';
import { EquipmenttypesModule } from 'src/equipmenttypes/equipmenttypes.module';
import { ComputerequipmenttypesModule } from '../computerequipmenttypes/computerequipmenttypes.module';
import { StoragetypesModule } from 'src/storagetypes/storagetypes.module';
import { OperatingsystemsModule } from 'src/operatingsystems/operatingsystems.module';
import { ComputerprocessorsModule } from 'src/computerprocessors/computerprocessors.module';
import { TypenetworksModule } from 'src/typenetworks/typenetworks.module';

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
})
export class EquipmentSeedModule {}
