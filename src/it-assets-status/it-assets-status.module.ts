import { Module } from '@nestjs/common';
import { ItAssetsStatusService } from './it-assets-status.service';
import { ItAssetsStatusController } from './it-assets-status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsStatus } from './entities/it-assets-status.entity';

@Module({
  controllers: [ItAssetsStatusController],
  providers: [ItAssetsStatusService],
  imports: [TypeOrmModule.forFeature([ItAssetsStatus])],
})
export class ItAssetsStatusModule {}
