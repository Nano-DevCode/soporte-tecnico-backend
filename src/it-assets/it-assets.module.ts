import { Module } from '@nestjs/common';
import { ItAssetsService } from './services/it-assets.service';
import { ItAssetsController } from './controllers/it-assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAsset } from './entities/it-asset.entity';
import { FilesModule } from 'src/files/files.module';

@Module({
  controllers: [ItAssetsController],
  providers: [ItAssetsService],
  imports: [TypeOrmModule.forFeature([ItAsset]), FilesModule],
  exports: [ItAssetsService, TypeOrmModule],
})
export class ItAssetsModule {}

