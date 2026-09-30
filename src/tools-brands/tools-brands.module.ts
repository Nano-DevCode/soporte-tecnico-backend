import { Module } from '@nestjs/common';
import { ToolsBrandsService } from './tools-brands.service';
import { ToolsBrandsController } from './tools-brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsBrand } from './entities/tools-brand.entity';

@Module({
  controllers: [ToolsBrandsController],
  providers: [ToolsBrandsService],
  imports: [TypeOrmModule.forFeature([ToolsBrand])],
})
export class ToolsBrandsModule {}
