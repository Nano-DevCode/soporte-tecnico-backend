import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from './dto/update-technical-report.dto';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TechnicalReport } from './entities/technical-report.entity';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { PAGINATION } from 'src/common/constants/pagination.constants';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { mapEquipmentToDto } from 'src/common/mappers/equipment.mapper';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TechnicalReportsService {
  constructor(
    @InjectRepository(TechnicalReport)
    private readonly technicalReportRepository: Repository<TechnicalReport>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly i18n: I18nService,
  ) {}

  create(
    {
      ticketId,
      equipment_ids,
      fault_validity_id,
      ...createTechnicalReportDto
    }: CreateTechnicalReportDto,
    transactionManager?: EntityManager,
  ) {
    const manager =
      transactionManager || this.technicalReportRepository.manager;

    const equipmentsRelations = equipment_ids?.map((id) => ({ id })) || [];

    const technicalReport = manager.create(TechnicalReport, {
      ...createTechnicalReportDto,
      ticket: { id: ticketId },
      equipments: equipmentsRelations,
      fault_validity: { id: fault_validity_id },
    });
    return manager.save(technicalReport);
  }

  async searchKnowledgeBase(paginationWithPageDto: PaginationWithPageDto) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
    } = paginationWithPageDto;

    const onlyResolved = false;
    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();

    const idQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.id', 'id')
      .innerJoin('ticket.technical_reports', 'technical_reports')
      .leftJoin('ticket.technical_reports', 'search_reports')
      .groupBy('ticket.id')
      .addGroupBy('ticket.created_at');

    if (onlyResolved) {
      idQuery.andWhere('search_reports.is_resolved = :isResolved', {
        isResolved: onlyResolved,
      });
    }

    if (cleanSearch) {
      const searchQuery = `websearch_to_tsquery('spanish', unaccent_immutable(:search))`;
      const reportVector = `search_reports.textsearchable_index_col`;
      const ticketVector = `setweight(to_tsvector('spanish', unaccent_immutable(coalesce(ticket.description, ''))), 'C')`;

      idQuery.andWhere(
        `(${reportVector} @@ ${searchQuery} OR ${ticketVector} @@ ${searchQuery})`,
        { search: cleanSearch },
      );

      idQuery.addSelect(
        `MAX(ts_rank_cd(${reportVector} || ${ticketVector}, ${searchQuery}))`,
        'search_rank',
      );

      idQuery.orderBy('search_rank', 'DESC');
    } else {
      idQuery.orderBy('ticket.created_at', 'DESC');
    }

    const total = await idQuery.getCount();

    idQuery.offset(offset).limit(limit);
    const rawResults = await idQuery.getRawMany();

    const ticketIds = rawResults.map((row: { id: string }) => row.id);

    let data: Ticket[] = [];

    if (ticketIds.length > 0) {
      data = await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.issue_type', 'issue_type')
        .innerJoinAndSelect('ticket.technical_reports', 'technical_reports')
        .leftJoinAndSelect('technical_reports.fault_validity', 'fault_validity')
        .where('ticket.id IN (:...ticketIds)', { ticketIds })
        .orderBy('technical_reports.created_at', 'ASC')
        .getMany();

      data.sort((a, b) => ticketIds.indexOf(a.id) - ticketIds.indexOf(b.id));
    }

    return PaginationResponse({ data: data, total }, { limit, page, search });
  }

  async findOneOrFail(id: string) {
    const technicalReport = await this.technicalReportRepository.findOne({
      where: { id },
      relations: {
        fault_validity: true,
        equipments: {
          id_type_equipment: true,
          id_model: {
            id_brand: true,
          },
          id_responsable: true,
          id_departament: true,
        },
      },
    });

    if (!technicalReport)
      throw new NotFoundException(
        this.i18n.t('errors.technical_reports.not_found', { args: { id } }),
      );

    return technicalReport;
  }

  async findOneMapped(id: string) {
    const technicalReport = await this.findOneOrFail(id);

    return {
      ...technicalReport,
      equipments: technicalReport.equipments.map((eq) => mapEquipmentToDto(eq)),
    };
  }

  async findAllByTicketId(id: string) {
    const reports = await this.technicalReportRepository.find({
      where: { ticket: { id: id } },
      order: { created_at: 'DESC' },
      relations: {
        fault_validity: true,
        equipments: {
          id_type_equipment: true,
          id_model: {
            id_brand: true,
          },
          id_responsable: true,
          id_departament: true,
        },
      },
    });

    return reports.map((report) => ({
      ...report,
      equipments: report.equipments.map((eq) => mapEquipmentToDto(eq)),
    }));
  }

  async update(
    id: string,
    { equipment_ids, fault_validity_id, ...restData }: UpdateTechnicalReportDto,
  ) {
    const preloadedReport = await this.technicalReportRepository.preload({
      id,
      ...restData,
      ...(equipment_ids !== undefined && {
        equipments: equipment_ids.map((eqId) => ({ id: eqId })),
      }),
      ...(fault_validity_id !== undefined && {
        fault_validity: { id: fault_validity_id },
      }),
    });
    if (!preloadedReport) {
      throw new NotFoundException(
        this.i18n.t('errors.technical_reports.not_found', { args: { id } }),
      );
    }

    return await this.technicalReportRepository.save(preloadedReport);
  }
}
