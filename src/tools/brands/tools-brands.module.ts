import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsBrandsService } from './services/tools-brands.service';
import { ToolsBrandsController } from './controllers/tools-brands.controller';
import { ToolsBrand } from './entities/tools-brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToolsBrand])],
  controllers: [ToolsBrandsController],
  providers: [ToolsBrandsService],
  exports: [ToolsBrandsService, TypeOrmModule],
})
export class ToolsBrandsModule {}
