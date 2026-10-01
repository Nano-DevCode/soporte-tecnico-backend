import { Module } from '@nestjs/common';
import { ToolsService } from './services/tools.service';
import { ToolsController } from './controllers/tools.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { FilesModule } from 'src/files/files.module';
import { ToolsBrandsModule } from './brands/tools-brands.module';
import { ToolsModelsModule } from './models/tools-models.module';
import { ToolsStatusModule } from './status/tools-status.module';
import { ToolsTypesModule } from './types/tools-types.module';
import { ToolsInvoicesModule } from './invoices/tools-invoices.module';
import { ToolsMovementsModule } from './movements/tools-movements.module';
import { ToolsSeedService } from './seed/services/tools-seed.service';
import { ToolsSeedController } from './seed/controllers/tools-seed.controller';

@Module({
  controllers: [ToolsController, ToolsSeedController],
  providers: [ToolsService, ToolsSeedService],
  imports: [
    TypeOrmModule.forFeature([Tool]),
    FilesModule,
    ToolsBrandsModule,
    ToolsModelsModule,
    ToolsStatusModule,
    ToolsTypesModule,
    ToolsInvoicesModule,
    ToolsMovementsModule,
  ],
  exports: [
    ToolsService,
    ToolsSeedService,
    ToolsBrandsModule,
    ToolsModelsModule,
    ToolsStatusModule,
    ToolsTypesModule,
    ToolsInvoicesModule,
    ToolsMovementsModule,
    TypeOrmModule,
  ],
})
export class ToolsModule {}
