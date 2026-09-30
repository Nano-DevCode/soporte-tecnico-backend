import { Module } from '@nestjs/common';
import { ComputingCenterManagerService } from './computing-center-manager.service';
import { ComputingCenterManagerController } from './computing-center-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComputingCenterManager } from './entities/computing-center-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComputingCenterManager])],
  controllers: [ComputingCenterManagerController],
  providers: [ComputingCenterManagerService],
  exports: [ComputingCenterManagerService],
})
export class ComputingCenterManagerModule {}
