import { Injectable } from '@nestjs/common';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from './dto/update-technical-report.dto';
import { EntityManager } from 'typeorm';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { TechnicalReportsCrudService } from './services/technical-reports-crud.service';
import { TechnicalReportsKnowledgeBaseService } from './services/technical-reports-knowledge-base.service';

@Injectable()
export class TechnicalReportsService {
  constructor(
    private readonly crudService: TechnicalReportsCrudService,
    private readonly knowledgeBaseService: TechnicalReportsKnowledgeBaseService,
  ) {}

  create(
    createTechnicalReportDto: CreateTechnicalReportDto,
    transactionManager?: EntityManager,
  ) {
    return this.crudService.create(
      createTechnicalReportDto,
      transactionManager,
    );
  }

  searchKnowledgeBase(paginationWithPageDto: PaginationWithPageDto) {
    return this.knowledgeBaseService.searchKnowledgeBase(paginationWithPageDto);
  }

  findOneOrFail(id: string) {
    return this.crudService.findOneOrFail(id);
  }

  findOneMapped(id: string) {
    return this.crudService.findOneMapped(id);
  }

  findAllByTicketId(id: string) {
    return this.crudService.findAllByTicketId(id);
  }

  update(id: string, updateTechnicalReportDto: UpdateTechnicalReportDto) {
    return this.crudService.update(id, updateTechnicalReportDto);
  }
}
