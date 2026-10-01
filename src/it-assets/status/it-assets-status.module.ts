import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsStatusService } from './services/it-assets-status.service';
import { ItAssetsStatusController } from './controllers/it-assets-status.controller';
import { ItAssetsStatus } from './entities/it-assets-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItAssetsStatus])],
  controllers: [ItAssetsStatusController],
  providers: [ItAssetsStatusService],
  exports: [ItAssetsStatusService, TypeOrmModule],
})
export class ItAssetsStatusModule {}
