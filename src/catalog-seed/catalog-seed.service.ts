import { Injectable } from '@nestjs/common';
import { SEED_DATA } from './data/data';
import { IssueTypeService } from 'src/issue_type/issue_type.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TypeDocumentsService } from 'src/type-documents/type-documents.service';
import { MaintenanceTypeService } from '../maintenance-type/maintenance-type.service';
import { ServiceTypeService } from '../service-type/service-type.service';
import { FaultValiditiesService } from '../fault-validities/fault-validities.service';

@Injectable()
export class CatalogSeedService {
  constructor(
    private readonly issueTypeService: IssueTypeService,
    private readonly ticketHistoryService: TicketHistoryService,
    private readonly typeDocumentService: TypeDocumentsService,
    private readonly maintenanceTypeService: MaintenanceTypeService,
    private readonly serviceTypeServiceice: ServiceTypeService,
    private readonly faultValiditiesService: FaultValiditiesService,
  ) {}

  async runSeed() {
    await this.newRunSeed();

    return 'Seed executed successfully';
  }

  private async catalogsSeed() {
    await this.issueTypeService.deleteAll();
    await this.ticketHistoryService.deleteAllStatus();
    await this.typeDocumentService.deleteAllTypeDocuments();

    const promises: Promise<unknown>[] = [];
    SEED_DATA.issueTypes.forEach((isueType) => {
      promises.push(this.issueTypeService.create(isueType));
    });
    SEED_DATA.typeDocuments.forEach((typeDocuement) => {
      promises.push(this.typeDocumentService.create(typeDocuement));
    });
    SEED_DATA.status.forEach((status) => {
      promises.push(this.ticketHistoryService.createStatus(status));
    });
  }

  private async newRunSeed() {
    await this.issueTypeService.deleteAll();
    await this.ticketHistoryService.deleteAllStatus();
    await this.typeDocumentService.deleteAllTypeDocuments();
    await this.maintenanceTypeService.deleteAll();
    await this.serviceTypeServiceice.deleteAll();

    for (const item of SEED_DATA.issueTypes) {
      await this.issueTypeService.create(item);
    }
    for (const item of SEED_DATA.status) {
      await this.ticketHistoryService.createStatus(item);
    }
    for (const item of SEED_DATA.typeDocuments) {
      await this.typeDocumentService.create(item);
    }
    for (const item of SEED_DATA.maintenanceTypes) {
      await this.maintenanceTypeService.create(item);
    }
    for (const item of SEED_DATA.serviceTypes) {
      await this.serviceTypeServiceice.create(item);
    }
  }

  async runSeedFaultValidities() {
    await this.faultValiditiesService.deleteAll();

    for (const item of SEED_DATA.faultValidities) {
      await this.faultValiditiesService.create(item);
    }

    return 'Seed executed successfully';
  }
}
