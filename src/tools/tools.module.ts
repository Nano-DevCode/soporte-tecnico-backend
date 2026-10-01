import { Module } from '@nestjs/common';
import { ToolsService } from './services/tools.service';
import { ToolsController } from './controllers/tools.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { FilesModule } from 'src/files/files.module';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
  imports: [TypeOrmModule.forFeature([Tool]), FilesModule],
  exports: [ToolsService, TypeOrmModule],
})
export class ToolsModule {}
