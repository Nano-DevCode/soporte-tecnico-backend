import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsInvoicesService } from './services/tools-invoices.service';
import { ToolsInvoicesController } from './controllers/tools-invoices.controller';
import { ToolsInvoice } from './entities/tools-invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToolsInvoice])],
  controllers: [ToolsInvoicesController],
  providers: [ToolsInvoicesService],
  exports: [ToolsInvoicesService, TypeOrmModule],
})
export class ToolsInvoicesModule {}
