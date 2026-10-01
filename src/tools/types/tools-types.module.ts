import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsTypesService } from './services/tools-types.service';
import { ToolsTypesController } from './controllers/tools-types.controller';
import { ToolsType } from './entities/tools-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToolsType])],
  controllers: [ToolsTypesController],
  providers: [ToolsTypesService],
  exports: [ToolsTypesService, TypeOrmModule],
})
export class ToolsTypesModule {}
