import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { PAGINATION } from 'src/common/constants/pagination.constants';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';

@Injectable()
export class TechnicalReportsKnowledgeBaseService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

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

    return PaginationResponse({ data, total }, { limit, page, search });
  }
}
