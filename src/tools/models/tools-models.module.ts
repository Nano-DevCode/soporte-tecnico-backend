import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsModelsService } from './services/tools-models.service';
import { ToolsModelsController } from './controllers/tools-models.controller';
import { ToolsModel } from './entities/tools-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToolsModel])],
  controllers: [ToolsModelsController],
  providers: [ToolsModelsService],
  exports: [ToolsModelsService, TypeOrmModule],
})
export class ToolsModelsModule {}
