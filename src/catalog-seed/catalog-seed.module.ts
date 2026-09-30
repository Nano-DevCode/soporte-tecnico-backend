import { Module } from '@nestjs/common';
import { CatalogSeedService } from './catalog-seed.service';
import { CatalogSeedController } from './catalog-seed.controller';
import { TicketHistoryModule } from 'src/ticket-history/ticket-history.module';
import { TypeDocumentsModule } from 'src/type-documents/type-documents.module';
import { IssueTypeModule } from 'src/issue_type/issue_type.module';
import { MaintenanceTypeModule } from 'src/maintenance-type/maintenance-type.module';
import { ServiceTypeModule } from 'src/service-type/service-type.module';
import { FaultValiditiesModule } from 'src/fault-validities/fault-validities.module';

@Module({
  imports: [
    TicketHistoryModule,
    TypeDocumentsModule,
    IssueTypeModule,
    MaintenanceTypeModule,
    ServiceTypeModule,
    FaultValiditiesModule,
  ],
  providers: [CatalogSeedService],
  controllers: [CatalogSeedController],
})
export class CatalogSeedModule {}
