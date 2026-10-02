import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { FilterTicketsForSelectDto } from '../dto/filter-tickets-for-select';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import {
  PAGINATION,
  SortOrder,
} from 'src/common/constants/pagination.constants';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { FindAllTicketMapper } from '../mappers/find-all-ticket.mapper';

@Injectable()
export class TicketQueriesService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  readonly allowedSortColumns: Record<string, string> = {
    created_at: 'ticket.created_at',
    folio: 'ticket.folio',
    priority: 'ticket.priority',
    department: 'department.name',
    status: 'latest_status_sort.code',
    issue_type: 'issue_type.name',
    school_period: 'school_period.name',
  };

  async findAllForUser(filterTicketsDto: FilterTicketsDto, user: User) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
      sortBy = 'created_at',
      sortOrder = SortOrder.DESC,
      priority,
      status,
      school_period,
      department,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filterTicketsDto;

    const finalSortColumn =
      this.allowedSortColumns[sortBy] || 'ticket.created_at';

    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();
    const idStaff = user.staff?.id;

    if (!idStaff) {
      return PaginationResponse(
        { data: [], total: 0 },
        { limit, page, search },
      );
    }

    const baseQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.attends', 'attends')
      .leftJoin('attends.technician', 'technician')
      .leftJoin('ticket.coordinator', 'coordinator')
      .leftJoin(
        (qb) =>
          qb
            .select('th.id', 'history_id')
            .addSelect('th."ticketId"', 'ticket_id')
            .from('ticket_history', 'th')
            .distinctOn(['th."ticketId"'])
            .orderBy('th."ticketId"')
            .addOrderBy('th.created_at', 'DESC'),
        'latest_history_sub',
        'latest_history_sub.ticket_id = ticket.id',
      )
      .leftJoin(
        'ticket_history',
        'latest_history_sort',
        'latest_history_sort.id = latest_history_sub.history_id',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort');

    if (start_date) {
      baseQuery.andWhere('ticket.created_at >= :startDate', {
        startDate: `${start_date} 00:00:00`,
      });
    }
    if (end_date) {
      baseQuery.andWhere('ticket.created_at <= :endDate', {
        endDate: `${end_date} 23:59:59`,
      });
    }
    if (cleanSearch) {
      const searchCondition =
        (user.role?.name as ValidRole) === ValidRole.jefe ||
        (user.role?.name as ValidRole) === ValidRole.visitor ||
        (user.role?.name as ValidRole) === ValidRole.planning
          ? '(ticket.folio ILIKE :search OR jefe_depto.name ILIKE :search)'
          : '(ticket.folio ILIKE :search OR ticket.internal_folio ILIKE :search OR jefe_depto.name ILIKE :search)';
      baseQuery.andWhere(searchCondition, { search: `%${cleanSearch}%` });
    }
    if (priority) {
      baseQuery.andWhere('ticket.priority = :priority', { priority });
    }
    if (status) {
      baseQuery.andWhere('latest_status_sort.code = :status', { status });
    }
    if (department) {
      baseQuery.andWhere('department.id = :department', { department });
    }
    if (school_period) {
      baseQuery.andWhere('school_period.id = :school_period', {
        school_period,
      });
    }
    if (issue_type) {
      baseQuery.andWhere('issue_type.id = :issue_type', { issue_type });
    }
    if (tags && tags.length > 0) {
      baseQuery
        .innerJoin('ticket.tags', 'tag_filter')
        .andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    switch (user.role.name as ValidRole) {
      case ValidRole.planning:
      case ValidRole.jefe:
        baseQuery.andWhere('jefe_depto.id = :idStaff', { idStaff });
        break;
      case ValidRole.tecnico:
      case ValidRole.inventory:
        baseQuery
          .andWhere('technician.id = :idStaff', { idStaff })
          .andWhere('attends.is_active = :isActive', { isActive: true });
        break;
      case ValidRole.coordinador:
        baseQuery.andWhere('coordinator.id = :idStaff', { idStaff });
        break;
    }

    baseQuery.select(['ticket.id', finalSortColumn]);
    baseQuery.orderBy(finalSortColumn, sortOrder).skip(offset).take(limit);

    const [rawIdsResult, total] = await baseQuery.getManyAndCount();
    const ticketIds = rawIdsResult.map((t) => t.id);

    if (ticketIds.length === 0) {
      return PaginationResponse(
        { data: [], total: 0 },
        { limit, page, search },
      );
    }

    const finalQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .whereInIds(ticketIds)
      .leftJoinAndSelect('ticket.issue_type', 'issue_type')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('ticket.school_period', 'school_period')
      .leftJoinAndSelect('jefe_depto.user', 'user')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'status')
      .leftJoinAndSelect('ticket.documents', 'documents')
      .leftJoinAndSelect('documents.type_document', 'type_document')
      .leftJoinAndSelect('ticket.tags', 'ticket_tags');

    const data = await finalQuery.getMany();

    const orderMap = new Map(ticketIds.map((id, index) => [id, index]));
    data.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    const mappedData = FindAllTicketMapper.toResponseArray(data);

    return PaginationResponse(
      { data: mappedData, total },
      { limit, page, search },
    );
  }

  async findCurrentForUser(filterTicketsDto: FilterTicketsDto, user: User) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
      sortBy = 'created_at',
      sortOrder = SortOrder.DESC,
      priority,
      status,
      school_period,
      department,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filterTicketsDto;

    const finalSortColumn =
      this.allowedSortColumns[sortBy] || 'ticket.created_at';

    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();
    const idStaff = user.staff?.id;

    if (!idStaff) {
      return PaginationResponse(
        { data: [], total: 0 },
        { limit, page, search },
      );
    }

    const baseQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.attends', 'attends')
      .leftJoin('attends.technician', 'technician')
      .leftJoin('ticket.coordinator', 'coordinator')
      .leftJoin(
        (qb) =>
          qb
            .select('th.id', 'history_id')
            .addSelect('th."ticketId"', 'ticket_id')
            .from('ticket_history', 'th')
            .distinctOn(['th."ticketId"'])
            .orderBy('th."ticketId"')
            .addOrderBy('th.created_at', 'DESC'),
        'latest_history_sub',
        'latest_history_sub.ticket_id = ticket.id',
      )
      .leftJoin(
        'ticket_history',
        'latest_history_sort',
        'latest_history_sort.id = latest_history_sub.history_id',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort');

    if (start_date) {
      baseQuery.andWhere('ticket.created_at >= :startDate', {
        startDate: `${start_date} 00:00:00`,
      });
    }

    if (end_date) {
      baseQuery.andWhere('ticket.created_at <= :endDate', {
        endDate: `${end_date} 23:59:59`,
      });
    }

    if (tags && tags.length > 0) {
      baseQuery
        .innerJoin('ticket.tags', 'tag_filter')
        .andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    if (cleanSearch) {
      const searchCondition =
        (user.role?.name as ValidRole) === ValidRole.jefe ||
        (user.role?.name as ValidRole) === ValidRole.visitor ||
        (user.role?.name as ValidRole) === ValidRole.planning
          ? '(ticket.folio ILIKE :search OR jefe_depto.name ILIKE :search)'
          : '(ticket.folio ILIKE :search OR ticket.internal_folio ILIKE :search OR jefe_depto.name ILIKE :search)';
      baseQuery.andWhere(searchCondition, { search: `%${cleanSearch}%` });
    }

    if (priority) {
      baseQuery.andWhere('ticket.priority = :priority', { priority });
    }

    if (status) {
      baseQuery.andWhere('latest_status_sort.code = :status', { status });
    }

    if (department) {
      baseQuery.andWhere('department.id = :department', { department });
    }

    if (school_period) {
      baseQuery.andWhere('school_period.id = :school_period', {
        school_period,
      });
    }

    if (issue_type) {
      baseQuery.andWhere('issue_type.id = :issue_type', { issue_type });
    }

    switch (user.role.name as ValidRole) {
      case ValidRole.superAdmin:
      case ValidRole.visitor:
      case ValidRole.jefecc:
      case ValidRole.secretaria:
        baseQuery.andWhere('latest_status_sort.code IN (:...statuses)', {
          statuses: [
            TicketStatus.RECIBIDA,
            TicketStatus.CANALIZADA,
            TicketStatus.ASIGNADA,
            TicketStatus.ATENDIENDO,
            TicketStatus.SOLUCIONADA,
            TicketStatus.NO_SOLUCIONADA,
          ],
        });
        break;

      case ValidRole.planning:
      case ValidRole.jefe:
        baseQuery
          .andWhere('jefe_depto.id = :idStaff', { idStaff })
          .andWhere('latest_status_sort.code IN (:...statuses)', {
            statuses: [
              TicketStatus.RECIBIDA,
              TicketStatus.CANALIZADA,
              TicketStatus.ASIGNADA,
              TicketStatus.ATENDIENDO,
              TicketStatus.SOLUCIONADA,
              TicketStatus.NO_SOLUCIONADA,
              TicketStatus.FINALIZADA,
              TicketStatus.RECHAZADA,
            ],
          });
        break;

      case ValidRole.inventory:
      case ValidRole.tecnico:
        baseQuery
          .andWhere('technician.id = :idStaff', { idStaff })
          .andWhere('attends.is_active = :isActive', { isActive: true })
          .andWhere('latest_status_sort.code IN (:...statuses)', {
            statuses: [TicketStatus.ASIGNADA, TicketStatus.ATENDIENDO],
          });
        break;

      case ValidRole.coordinador:
        baseQuery
          .andWhere('coordinator.id = :idStaff', { idStaff })
          .andWhere('latest_status_sort.code IN (:...statuses)', {
            statuses: [
              TicketStatus.CANALIZADA,
              TicketStatus.ASIGNADA,
              TicketStatus.ATENDIENDO,
              TicketStatus.SOLUCIONADA,
              TicketStatus.NO_SOLUCIONADA,
            ],
          });
        break;

      default:
        return PaginationResponse(
          { data: [], total: 0 },
          { limit, page, search },
        );
    }

    baseQuery.select(['ticket.id', finalSortColumn]);
    baseQuery.orderBy(finalSortColumn, sortOrder).skip(offset).take(limit);

    const [rawIdsResult, total] = await baseQuery.getManyAndCount();
    const ticketIds = rawIdsResult.map((t) => t.id);

    if (ticketIds.length === 0) {
      return PaginationResponse(
        { data: [], total: 0 },
        { limit, page, search },
      );
    }

    const finalQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .whereInIds(ticketIds)
      .leftJoinAndSelect('ticket.issue_type', 'issue_type')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('ticket.school_period', 'school_period')
      .leftJoinAndSelect('jefe_depto.user', 'user')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'status')
      .leftJoinAndSelect('ticket.documents', 'documents')
      .leftJoinAndSelect('documents.type_document', 'type_document')
      .leftJoinAndSelect('ticket.tags', 'ticket_tags');

    const data = await finalQuery.getMany();

    const orderMap = new Map(ticketIds.map((id, index) => [id, index]));
    data.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    const mappedData = FindAllTicketMapper.toResponseArray(data);

    return PaginationResponse(
      { data: mappedData, total },
      { limit, page, search },
    );
  }

  async findAllClosedAndArchived(filterTicketsDto: FilterTicketsDto) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
      sortBy = 'created_at',
      sortOrder = SortOrder.DESC,
      priority,
      status,
      school_period,
      department,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filterTicketsDto;

    const allowedStatuses = [TicketStatus.CERRADA, TicketStatus.ARCHIVADA];
    const finalSortColumn =
      this.allowedSortColumns[sortBy] || 'ticket.created_at';
    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();

    const baseQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin(
        (qb) =>
          qb
            .select('th.id', 'history_id')
            .addSelect('th."ticketId"', 'ticket_id')
            .from('ticket_history', 'th')
            .distinctOn(['th."ticketId"'])
            .orderBy('th."ticketId"')
            .addOrderBy('th.created_at', 'DESC'),
        'latest_history_sub',
        'latest_history_sub.ticket_id = ticket.id',
      )
      .leftJoin(
        'ticket_history',
        'latest_history_sort',
        'latest_history_sort.id = latest_history_sub.history_id',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort');

    if (start_date) {
      baseQuery.andWhere('ticket.created_at >= :startDate', {
        startDate: `${start_date} 00:00:00`,
      });
    }
    if (end_date) {
      baseQuery.andWhere('ticket.created_at <= :endDate', {
        endDate: `${end_date} 23:59:59`,
      });
    }
    if (cleanSearch) {
      baseQuery.andWhere(
        '(ticket.folio ILIKE :search OR jefe_depto.name ILIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }
    if (priority) {
      baseQuery.andWhere('ticket.priority = :priority', { priority });
    }
    if (department) {
      baseQuery.andWhere('department.id = :department', { department });
    }
    if (school_period) {
      baseQuery.andWhere('school_period.id = :school_period', {
        school_period,
      });
    }
    if (issue_type) {
      baseQuery.andWhere('issue_type.id = :issue_type', { issue_type });
    }
    if (tags && tags.length > 0) {
      baseQuery
        .innerJoin('ticket.tags', 'tag_filter')
        .andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    if (status) {
      if (allowedStatuses.includes(status as TicketStatus)) {
        baseQuery.andWhere('latest_status_sort.code = :status', { status });
      } else {
        return PaginationResponse(
          { data: [], total: 0 },
          { limit, page, search },
        );
      }
    } else {
      baseQuery.andWhere('latest_status_sort.code IN (:...globalStatuses)', {
        globalStatuses: allowedStatuses,
      });
    }

    baseQuery.select(['ticket.id', finalSortColumn]);
    baseQuery.orderBy(finalSortColumn, sortOrder).skip(offset).take(limit);

    const [rawIdsResult, total] = await baseQuery.getManyAndCount();
    const ticketIds = rawIdsResult.map((t) => t.id);

    if (ticketIds.length === 0) {
      return PaginationResponse(
        { data: [], total: 0 },
        { limit, page, search },
      );
    }

    const finalQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .whereInIds(ticketIds)
      .leftJoinAndSelect('ticket.issue_type', 'issue_type')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('ticket.school_period', 'school_period')
      .leftJoinAndSelect('jefe_depto.user', 'user')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'status')
      .leftJoinAndSelect('ticket.documents', 'documents')
      .leftJoinAndSelect('documents.type_document', 'type_document')
      .leftJoinAndSelect('ticket.tags', 'ticket_tags');

    const data = await finalQuery.getMany();

    const orderMap = new Map(ticketIds.map((id, index) => [id, index]));
    data.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    const mappedData = FindAllTicketMapper.toResponseArray(data);

    return PaginationResponse(
      { data: mappedData, total },
      { limit, page, search },
    );
  }

  async findAllByStatusForSelect({ status }: FilterTicketsForSelectDto) {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'statusRelation')
      .leftJoinAndSelect('ticket.issue_type', 'issue_type')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('ticket.school_period', 'school_period')
      .leftJoinAndSelect('jefe_depto.user', 'user')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoin(
        'ticket.ticket_histories',
        'latest_history_sort',
        'latest_history_sort.id = (SELECT th.id FROM ticket_history th WHERE th."ticketId" = ticket.id ORDER BY th.created_at DESC LIMIT 1)',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort')
      .addSelect('latest_status_sort.code');

    query.where('latest_status_sort.code IN (:...status)', { status });
    query.orderBy('ticket.created_at', 'DESC');

    const data = await query.getMany();

    return FindAllTicketMapper.toResponseArray(data);
  }

  async findAllPaginated(paginationWithPageDto: PaginationWithPageDto) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
    } = paginationWithPageDto;

    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'statusRelation')
      .leftJoinAndSelect('ticket.issue_type', 'issue_type')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('ticket.school_period', 'school_period')
      .leftJoinAndSelect('jefe_depto.user', 'user')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoin(
        'ticket.ticket_histories',
        'latest_history_sort',
        'latest_history_sort.id = (SELECT th.id FROM ticket_history th WHERE th."ticketId" = ticket.id ORDER BY th.created_at DESC LIMIT 1)',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort')
      .addSelect('latest_status_sort.code');

    query.orderBy('ticket.created_at', 'DESC');

    if (cleanSearch) {
      query.andWhere('(ticket.folio ILIKE :search)', {
        search: `%${cleanSearch}%`,
      });
    }

    query.skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();

    const mappedData = FindAllTicketMapper.toResponseArray(data);

    return PaginationResponse(
      { data: mappedData, total },
      { limit, page, search },
    );
  }
}
