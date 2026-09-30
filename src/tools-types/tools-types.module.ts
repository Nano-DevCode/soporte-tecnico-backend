import { Module } from '@nestjs/common';
import { ToolsTypesService } from './tools-types.service';
import { ToolsTypesController } from './tools-types.controller';
import { ToolsType } from './entities/tools-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsTypesController],
  providers: [ToolsTypesService],
  imports: [TypeOrmModule.forFeature([ToolsType])],
})
export class ToolsTypesModule {}
