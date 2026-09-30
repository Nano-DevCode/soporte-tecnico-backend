import { Module } from '@nestjs/common';
import { ItAssetsTypesService } from './it-assets-types.service';
import { ItAssetsTypesController } from './it-assets-types.controller';
import { ItAssetsType } from './entities/it-assets-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ItAssetsTypesController],
  providers: [ItAssetsTypesService],
  imports: [TypeOrmModule.forFeature([ItAssetsType])],
})
export class ItAssetsTypesModule {}
