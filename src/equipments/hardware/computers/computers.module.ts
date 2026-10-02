import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComputersService } from './computers.service';
import { ComputersController } from './computers.controller';
import { Computer } from './entities/computer.entity';
import { ComputerequipmenttypesModule } from './types/computerequipmenttypes.module';
import { ComputerprocessorsModule } from './processors/computerprocessors.module';
import { OperatingsystemsModule } from './operating-systems/operatingsystems.module';
import { StoragetypesModule } from './storage-types/storagetypes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Computer]),
    ComputerequipmenttypesModule,
    ComputerprocessorsModule,
    OperatingsystemsModule,
    StoragetypesModule,
  ],
  controllers: [ComputersController],
  providers: [ComputersService],
  exports: [
    ComputersService,
    TypeOrmModule,
    ComputerequipmenttypesModule,
    ComputerprocessorsModule,
    OperatingsystemsModule,
    StoragetypesModule,
  ],
})
export class ComputersModule {}
