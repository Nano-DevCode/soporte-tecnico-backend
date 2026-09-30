import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { FilesModule } from 'src/files/files.module';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
  imports: [TypeOrmModule.forFeature([Tool]), FilesModule],
  exports: [ToolsService],
})
export class ToolsModule {}
