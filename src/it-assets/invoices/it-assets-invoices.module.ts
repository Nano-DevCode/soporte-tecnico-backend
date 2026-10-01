import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsInvoicesService } from './services/it-assets-invoices.service';
import { ItAssetsInvoicesController } from './controllers/it-assets-invoices.controller';
import { ItAssetsInvoice } from './entities/it-assets-invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItAssetsInvoice])],
  controllers: [ItAssetsInvoicesController],
  providers: [ItAssetsInvoicesService],
  exports: [ItAssetsInvoicesService, TypeOrmModule],
})
export class ItAssetsInvoicesModule {}
