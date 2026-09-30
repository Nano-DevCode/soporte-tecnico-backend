import { Module } from '@nestjs/common';
import { ItAssetsModelsService } from './it-assets-models.service';
import { ItAssetsModelsController } from './it-assets-models.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsModel } from './entities/it-assets-model.entity';

@Module({
  controllers: [ItAssetsModelsController],
  providers: [ItAssetsModelsService],
  imports: [TypeOrmModule.forFeature([ItAssetsModel])],
})
export class ItAssetsModelsModule {}
