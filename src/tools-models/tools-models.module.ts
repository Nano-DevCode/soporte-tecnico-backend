import { Module } from '@nestjs/common';
import { ToolsModelsService } from './tools-models.service';
import { ToolsModelsController } from './tools-models.controller';
import { ToolsModel } from './entities/tools-model.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsModelsController],
  providers: [ToolsModelsService],
  imports: [TypeOrmModule.forFeature([ToolsModel])],
})
export class ToolsModelsModule {}
