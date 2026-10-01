import { Module } from '@nestjs/common';
import { ItAssetsService } from './services/it-assets.service';
import { ItAssetsController } from './controllers/it-assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAsset } from './entities/it-asset.entity';
import { FilesModule } from 'src/files/files.module';
import { ItAssetsBrandsModule } from './brands/it-assets-brands.module';
import { ItAssetsModelsModule } from './models/it-assets-models.module';

@Module({
  controllers: [ItAssetsController],
  providers: [ItAssetsService],
  imports: [
    TypeOrmModule.forFeature([ItAsset]),
    FilesModule,
    ItAssetsBrandsModule,
    ItAssetsModelsModule,
  ],
  exports: [
    ItAssetsService,
    ItAssetsBrandsModule,
    ItAssetsModelsModule,
    TypeOrmModule,
  ],
})
export class ItAssetsModule {}
