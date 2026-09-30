import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { ConsumableMovement } from 'src/consumable-movements/entities/consumable-movement.entity';
import { TicketHistoryService } from '../ticket-history/ticket-history.service';
import { TicketSurvey } from 'src/survey/entities/ticket-survey.entity';
import {
  CountResult,
  MaintenanceCountResult,
  RawDepartmentRow,
  RawIssueTypeRow,
  RawTicketCount,
  SumResult,
} from './interfaces/count.interface';
import { Department } from 'src/departments/entities/department.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';
import {
  LimitResolutionTime,
  START_OPERATION_DATE,
  TicketPriorityLevel,
} from 'src/config/params.config';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(ConsumableMovement)
    private readonly consumableMovementRepository: Repository<ConsumableMovement>,
    @InjectRepository(TicketSurvey)
    private readonly surveyRepository: Repository<TicketSurvey>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(IssueType)
    private readonly issueTypeRepository: Repository<IssueType>,

    private readonly ticketHistoryService: TicketHistoryService,
  ) {}

  private parseLocalDate(dateString: string, isEndOfDay = false): Date {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      isEndOfDay ? 23 : 0,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 999 : 0,
    );
  }

  calculateDateRange(
    start_date?: string,
    end_date?: string,
    defaultStartDate?: Date,
  ) {
    const now = new Date();

    const fallbackStart = defaultStartDate || START_OPERATION_DATE;

    const startDate = start_date
      ? this.parseLocalDate(start_date)
      : fallbackStart;

    const endDate = end_date ? this.parseLocalDate(end_date, true) : now;

    return { startDate, endDate };
  }

  async getCriticalServiceAvailability(
    filters: DashboardFiltersDto,
  ): Promise<number> {
    const {
      status,
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const { endDate, startDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.ticket_histories', 'ticket_histories')
      .leftJoinAndSelect('ticket_histories.status', 'status')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('ticket.school_period', 'school_period')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin(
        'ticket.ticket_histories',
        'latest_history_sort',
        'latest_history_sort.id = (SELECT th.id FROM ticket_history th WHERE th."ticketId" = ticket.id ORDER BY th.created_at DESC LIMIT 1)',
      )
      .leftJoin('latest_history_sort.status', 'latest_status_sort')
      .where('ticket.priority = :criticalPriority', {
        criticalPriority: TicketPriorityLevel.CRITIC,
      });

    query.andWhere('ticket.created_at BETWEEN :startDate AND :endDate', {
      startDate,
      endDate,
    });

    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    if (status) {
      query.andWhere('latest_status_sort.code = :status', { status });
    }

    if (department) {
      query.andWhere('department.id = :department', { department });
    }

    if (school_period) {
      query.andWhere('school_period.id = :school_period', { school_period });
    }

    if (issue_type) {
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    }

    query.orderBy('ticket.created_at', 'ASC');

    const criticalTickets = await query.getMany();

    const downtimeIntervals = criticalTickets.map((ticket) => {
      const startTime = ticket.created_at.getTime();

      const solucionadaHistory = ticket.ticket_histories?.find(
        (h) => h.status.code === (TicketStatus.SOLUCIONADA as string),
      );

      const ticketEndTime = solucionadaHistory
        ? solucionadaHistory.created_at.getTime()
        : endDate.getTime();

      const endTime = Math.min(ticketEndTime, endDate.getTime());

      return { start: startTime, end: endTime };
    });

    const mergedDowntimes = this.mergeIntervals(downtimeIntervals);

    const totalDowntimeMs = mergedDowntimes.reduce((total, interval) => {
      return total + (interval.end - interval.start);
    }, 0);
    const totalDowntimeHours = totalDowntimeMs / (1000 * 60 * 60);

    const totalCalendarMs = endDate.getTime() - startDate.getTime();
    const totalCalendarHours = totalCalendarMs / (1000 * 60 * 60);

    if (totalCalendarHours === 0) return 100;

    let availability =
      ((totalCalendarHours - totalDowntimeHours) / totalCalendarHours) * 100;

    if (availability < 0) availability = 0;
    if (availability > 100) availability = 100;

    return Number(availability.toFixed(2));
  }

  private mergeIntervals(intervals: { start: number; end: number }[]) {
    if (intervals.length === 0) return [];

    intervals.sort((a, b) => a.start - b.start);

    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const current = intervals[i];
      const lastMerged = merged[merged.length - 1];

      if (current.start <= lastMerged.end) {
        lastMerged.end = Math.max(lastMerged.end, current.end);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  // Tiempo promedio de recuperación
  async getMeanTimeToRecovery(filters: DashboardFiltersDto): Promise<{
    currentMttr: number;
    previousMttr: number;
    difference: number;
    isImproved: boolean;
  }> {
    const {
      priority,
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const now = new Date();

    let currentStartDate: Date;
    let currentEndDate: Date;

    if (start_date && end_date) {
      currentStartDate = this.parseLocalDate(start_date);
      currentEndDate = this.parseLocalDate(end_date, true);
    } else {
      const currentMonth = now.getMonth();
      const startOfQuarterMonth = currentMonth - (currentMonth % 3);

      currentStartDate = new Date(
        now.getFullYear(),
        startOfQuarterMonth,
        1,
        0,
        0,
        0,
        0,
      );
      currentEndDate = now;
    }

    const durationMs = currentEndDate.getTime() - currentStartDate.getTime();

    const prevEndDate = new Date(currentStartDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    const createBaseQuery = () => {
      const qb = this.ticketRepository
        .createQueryBuilder('ticket')
        .innerJoin('ticket.ticket_histories', 'history_solucionada')
        .innerJoin(
          'history_solucionada.status',
          'status_solucionada',
          'status_solucionada.code = :solCode',
          { solCode: TicketStatus.SOLUCIONADA },
        )
        .leftJoin('ticket.issue_type', 'issue_type')
        .leftJoin('ticket.jefe_depto', 'jefe_depto')
        .leftJoin('jefe_depto.department', 'department')
        .leftJoin('ticket.school_period', 'school_period');

      if (priority) qb.andWhere('ticket.priority = :priority', { priority });
      if (department)
        qb.andWhere('department.id = :department', { department });
      if (school_period)
        qb.andWhere('school_period.id = :school_period', { school_period });
      if (issue_type)
        qb.andWhere('issue_type.id = :issue_type', { issue_type });
      if (tags && tags.length > 0) {
        qb.innerJoin('ticket.tags', 'tag_filter');
        qb.andWhere('tag_filter.name IN (:...tags)', { tags });
      }

      return qb;
    };

    const currentQuery = createBaseQuery()
      .andWhere(
        'ticket.created_at BETWEEN :currentStartDate AND :currentEndDate',
        {
          currentStartDate,
          currentEndDate,
        },
      )
      .select(
        'AVG(EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)))',
        'avg_seconds',
      );

    const prevQuery = createBaseQuery()
      .andWhere('ticket.created_at BETWEEN :prevStartDate AND :prevEndDate', {
        prevStartDate,
        prevEndDate,
      })
      .select(
        'AVG(EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)))',
        'avg_seconds',
      );

    type MttrRawResult = { avg_seconds: string | null };

    const [currentResult, prevResult] = await Promise.all([
      currentQuery.getRawOne<MttrRawResult>(),
      prevQuery.getRawOne<MttrRawResult>(),
    ]);

    const currentSeconds = currentResult?.avg_seconds
      ? Number(currentResult.avg_seconds)
      : 0;
    const prevSeconds = prevResult?.avg_seconds
      ? Number(prevResult.avg_seconds)
      : 0;

    const currentMttr = Number((currentSeconds / 3600).toFixed(2));
    const previousMttr = Number((prevSeconds / 3600).toFixed(2));

    const difference = Number((currentMttr - previousMttr).toFixed(2));
    const isImproved = currentMttr <= previousMttr;

    return {
      currentMttr,
      previousMttr,
      difference,
      isImproved,
    };
  }

  // Interrupciones criticas por mes
  async getCriticalInterruptionsPerMonth(
    filters: DashboardFiltersDto,
  ): Promise<{ month: string; count: number }[]> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const now = new Date();
    const lastSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
      lastSixMonths,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select("TO_CHAR(ticket.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(ticket.id)', 'count')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.priority = :criticalPriority', {
        criticalPriority: TicketPriorityLevel.CRITIC,
      })
      .andWhere('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (department) {
      query.andWhere('department.id = :department', { department });
    }
    if (school_period) {
      query.andWhere('school_period.id = :school_period', { school_period });
    }
    if (issue_type) {
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    }
    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    query.groupBy("TO_CHAR(ticket.created_at, 'YYYY-MM')");
    query.orderBy('month', 'ASC');

    const rawResults = await query.getRawMany<{
      month: string;
      count: string;
    }>();

    const finalResults: { month: string; count: number }[] = [];

    const iteratorDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );

    while (iteratorDate <= endDate) {
      const monthStr = `${iteratorDate.getFullYear()}-${String(iteratorDate.getMonth() + 1).padStart(2, '0')}`;
      const found = rawResults.find((r) => r.month === monthStr);

      finalResults.push({
        month: monthStr,
        count: found ? Number(found.count) : 0,
      });

      iteratorDate.setMonth(iteratorDate.getMonth() + 1);
    }

    return finalResults;
  }

  //  Promedio de resolucion por prioridad
  async getAverageResolutionTimeByPriority(
    filters: DashboardFiltersDto,
  ): Promise<{ priority: number; avg_hours: number }[]> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.priority', 'priority')
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at))) / 3600',
        'avg_hours',
      )
      .innerJoin('ticket.ticket_histories', 'history_solucionada')
      .innerJoin(
        'history_solucionada.status',
        'status_solucionada',
        'status_solucionada.code = :solCode',
        { solCode: TicketStatus.SOLUCIONADA },
      )
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (department) {
      query.andWhere('department.id = :department', { department });
    }
    if (school_period) {
      query.andWhere('school_period.id = :school_period', { school_period });
    }
    if (issue_type) {
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    }
    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    query.groupBy('ticket.priority').orderBy('ticket.priority', 'ASC');

    const result = await query.getRawMany<{
      priority: number;
      avg_hours: string;
    }>();

    const allPriorities = [1, 2, 3, 4];

    return allPriorities.map((p) => {
      const found = result.find((row) => Number(row.priority) === p);

      return {
        priority: p,
        avg_hours: found ? Number(Number(found.avg_hours).toFixed(2)) : 0,
      };
    });
  }

  // Solucion en primer nivel
  async getFirstLevelResolution(filters: DashboardFiltersDto): Promise<{
    percentage: number;
    totalResolved: number;
    firstLevelResolved: number;
  }> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.ticket_histories', 'history_solucionada')
      .innerJoin(
        'history_solucionada.status',
        'status_solucionada',
        'status_solucionada.code = :solCode',
        { solCode: TicketStatus.SOLUCIONADA },
      )
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (department)
      query.andWhere('department.id = :department', { department });
    if (school_period)
      query.andWhere('school_period.id = :school_period', { school_period });
    if (issue_type)
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    const totalResolved = await query.getCount();

    if (totalResolved === 0) {
      return { percentage: 100, totalResolved: 0, firstLevelResolved: 0 };
    }

    query.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('tr."ticketId"')
        .from('technical_report', 'tr')
        .groupBy('tr."ticketId"')
        .having('COUNT(tr.id) > 1')
        .getQuery();

      return `ticket.id NOT IN ${subQuery}`;
    });

    const firstLevelResolved = await query.getCount();

    const percentage = Number(
      ((firstLevelResolved / totalResolved) * 100).toFixed(2),
    );

    return { percentage, totalResolved, firstLevelResolved };
  }

  async getSlaCompliance(
    filters: DashboardFiltersDto,
  ): Promise<{ percentage: number; totalResolved: number; slaMet: number }> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.ticket_histories', 'history_solucionada')
      .innerJoin(
        'history_solucionada.status',
        'status_solucionada',
        'status_solucionada.code = :solCode',
        { solCode: TicketStatus.SOLUCIONADA },
      )
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (department)
      query.andWhere('department.id = :department', { department });
    if (school_period)
      query.andWhere('school_period.id = :school_period', { school_period });
    if (issue_type)
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    query.select('COUNT(ticket.id)', 'total_resolved').addSelect(
      `
        SUM(
          CASE 
            WHEN ticket.priority = '${TicketPriorityLevel.CRITIC}' AND (EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)) / 3600) <= ${LimitResolutionTime[TicketPriorityLevel.CRITIC]} THEN 1
            WHEN ticket.priority = '${TicketPriorityLevel.HIGH}' AND (EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)) / 3600) <= ${LimitResolutionTime[TicketPriorityLevel.HIGH]} THEN 1
            WHEN ticket.priority = '${TicketPriorityLevel.MEDIUM}' AND (EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)) / 3600) <= ${LimitResolutionTime[TicketPriorityLevel.MEDIUM]} THEN 1
            WHEN ticket.priority = '${TicketPriorityLevel.LOW}' AND (EXTRACT(EPOCH FROM (history_solucionada.created_at - ticket.created_at)) / 3600) <= ${LimitResolutionTime[TicketPriorityLevel.LOW]} THEN 1
            ELSE 0 
          END
        )`,
      'sla_met_count',
    );

    const result = await query.getRawOne<{
      total_resolved: string;
      sla_met_count: string;
    }>();

    const totalResolved = result?.total_resolved
      ? Number(result.total_resolved)
      : 0;
    const slaMet = result?.sla_met_count ? Number(result.sla_met_count) : 0;

    if (totalResolved === 0) {
      return { percentage: 100, totalResolved: 0, slaMet: 0 };
    }

    const percentage = Number(((slaMet / totalResolved) * 100).toFixed(2));

    return { percentage, totalResolved, slaMet };
  }

  async getPreventiveMaintenanceCoverage(
    filters: DashboardFiltersDto,
  ): Promise<{
    percentage: number;
    totalEquipment: number;
    maintainedEquipment: number;
  }> {
    const { department, start_date, end_date } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const totalEqQuery = this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.status = :status', { status: true });

    if (department) {
      totalEqQuery.andWhere('equipment.id_departament = :department', {
        department,
      });
    }
    const totalEquipment = await totalEqQuery.getCount();

    if (totalEquipment === 0)
      return { percentage: 0, totalEquipment: 0, maintainedEquipment: 0 };

    const maintainedEqQuery = this.equipmentRepository
      .createQueryBuilder('equipment')
      .innerJoin('equipment.technical_reports', 'tr')
      .innerJoin('tr.fault_validity', 'fv')
      .innerJoin('tr.ticket', 'ticket')
      .where('fv.name = :faultName', { faultName: 'Mantenimiento preventivo' })
      .andWhere('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('equipment.status = :status', { status: true });

    if (department) {
      maintainedEqQuery.andWhere('equipment.id_departament = :department', {
        department,
      });
    }
    maintainedEqQuery.select('COUNT(DISTINCT equipment.id)', 'count');

    const result = await maintainedEqQuery.getRawOne<MaintenanceCountResult>();

    const maintainedEquipment = result?.count ? Number(result.count) : 0;

    const percentage = Number(
      ((maintainedEquipment / totalEquipment) * 100).toFixed(2),
    );

    return { percentage, totalEquipment, maintainedEquipment };
  }

  async getCostPerIncident(
    filters: DashboardFiltersDto,
  ): Promise<{ averageCost: number; totalCost: number; totalTickets: number }> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const applyFilters = <T extends ObjectLiteral>(
      queryBuilder: SelectQueryBuilder<T>,
    ) => {
      if (department) {
        queryBuilder.andWhere('department.id = :department', { department });
      }
      if (school_period) {
        queryBuilder.andWhere('school_period.id = :school_period', {
          school_period,
        });
      }
      if (issue_type) {
        queryBuilder.andWhere('issue_type.id = :issue_type', { issue_type });
      }
      if (tags && tags.length > 0) {
        queryBuilder.innerJoin('ticket.tags', 'tag_filter');
        queryBuilder.andWhere('tag_filter.name IN (:...tags)', { tags });
      }
    };
    const ticketsQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.ticket_histories', 'history_solucionada')
      .innerJoin(
        'history_solucionada.status',
        'status_solucionada',
        'status_solucionada.code = :solCode',
        { solCode: TicketStatus.SOLUCIONADA },
      )
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    applyFilters(ticketsQuery);

    ticketsQuery.select('COUNT(DISTINCT ticket.id)', 'count');

    const tResult = await ticketsQuery.getRawOne<CountResult>();
    const totalTickets = tResult?.count ? Number(tResult.count) : 0;

    if (totalTickets === 0) {
      return { averageCost: 0, totalCost: 0, totalTickets: 0 };
    }

    const costQuery = this.consumableMovementRepository
      .createQueryBuilder('cm')
      .innerJoin('cm.id_ticket', 'ticket')
      .innerJoin('ticket.ticket_histories', 'history_solucionada')
      .innerJoin(
        'history_solucionada.status',
        'status_solucionada',
        'status_solucionada.code = :solCode',
        { solCode: TicketStatus.SOLUCIONADA },
      )
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    applyFilters(costQuery);

    costQuery.select('SUM(cm.movement_cost)', 'total');

    const cResult = await costQuery.getRawOne<SumResult>();

    const totalCost = cResult?.total ? Number(cResult.total) : 0;
    const averageCost = Number((totalCost / totalTickets).toFixed(2));

    return { averageCost, totalCost, totalTickets };
  }

  async getTicketsByStatus(
    filters: DashboardFiltersDto,
  ): Promise<{ status: string; code: string; count: number }[]> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
    } = filters;
    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.ticket_histories', 'current_history')
      .innerJoin('current_history.status', 'status')
      .leftJoin(
        'ticket.ticket_histories',
        'newer_history',
        'newer_history.created_at > current_history.created_at',
      )
      .where('newer_history.id IS NULL')
      .andWhere('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (department) {
      query
        .leftJoin('ticket.jefe_depto', 'jefe_depto')
        .leftJoin('jefe_depto.department', 'department')
        .andWhere('department.id = :department', { department });
    }

    if (school_period) {
      query
        .leftJoin('ticket.school_period', 'school_period')
        .andWhere('school_period.id = :school_period', { school_period });
    }

    if (issue_type) {
      query
        .leftJoin('ticket.issue_type', 'issue_type')
        .andWhere('issue_type.id = :issue_type', { issue_type });
    }

    if (tags && tags.length > 0) {
      query
        .innerJoin('ticket.tags', 'tag_filter')
        .andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    query
      .select([
        'status.name AS status_name',
        'COUNT(DISTINCT ticket.id) AS ticket_count',
      ])
      .groupBy('status.id')
      .addGroupBy('status.name');

    const result: RawTicketCount[] = await query.getRawMany();

    const status = await this.ticketHistoryService.findAllStatus();

    return status.map((item) => ({
      status: item.name,
      code: item.code,
      count: Number(
        result.find((counted) => counted.status_name === item.name)
          ?.ticket_count || 0,
      ),
    }));
  }

  async getUserSatisfactionMetrics(filters: DashboardFiltersDto): Promise<{
    averageScore: number;
    csatPercentage: number;
    totalSurveys: number;
    questionBreakdown: {
      questionId: string;
      questionText: string;
      average: number;
      totalResponses: number;
    }[];
  }> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
      priority,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.surveyRepository
      .createQueryBuilder('survey')
      .innerJoin('survey.ticket', 'ticket')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (priority) {
      query.andWhere('ticket.priority = :priority', { priority });
    }

    if (department) {
      query.andWhere('department.id = :department', { department });
    }
    if (school_period) {
      query.andWhere('school_period.id = :school_period', { school_period });
    }
    if (issue_type) {
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    }
    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    const surveys = await query.getMany();
    const totalSurveys = surveys.length;

    if (totalSurveys === 0) {
      return {
        averageScore: 0,
        csatPercentage: 0,
        totalSurveys: 0,
        questionBreakdown: [],
      };
    }

    let totalRatingSum = 0;
    let totalRatingCount = 0;
    let satisfiedSurveysCount = 0;
    let validSurveysCount = 0;

    const questionStatsMap = new Map<
      string,
      { text: string; sum: number; count: number }
    >();

    surveys.forEach((survey) => {
      if (Array.isArray(survey.answers) && survey.answers.length > 0) {
        let surveyRatingSum = 0;
        let surveyRatingCount = 0;

        survey.answers.forEach((ans) => {
          if (ans.type === 'RATING' && typeof ans.value === 'number') {
            const val = Number(ans.value);

            totalRatingSum += val;
            totalRatingCount++;

            surveyRatingSum += val;
            surveyRatingCount++;

            if (!questionStatsMap.has(ans.questionId)) {
              questionStatsMap.set(ans.questionId, {
                text: ans.questionText,
                sum: 0,
                count: 0,
              });
            }
            const qStat = questionStatsMap.get(ans.questionId)!;
            qStat.sum += val;
            qStat.count++;
          }
        });

        if (surveyRatingCount > 0) {
          validSurveysCount++;
          const ticketAverage = surveyRatingSum / surveyRatingCount;

          if (ticketAverage >= 4.0) {
            satisfiedSurveysCount++;
          }
        }
      }
    });

    if (totalRatingCount === 0 || validSurveysCount === 0) {
      return {
        averageScore: 0,
        csatPercentage: 0,
        totalSurveys,
        questionBreakdown: [],
      };
    }

    const averageScore = Number((totalRatingSum / totalRatingCount).toFixed(2));
    const csatPercentage = Number(
      ((satisfiedSurveysCount / validSurveysCount) * 100).toFixed(2),
    );

    const questionBreakdown = Array.from(questionStatsMap.entries()).map(
      ([id, stat]) => ({
        questionId: id,
        questionText: stat.text,
        average: Number((stat.sum / stat.count).toFixed(2)),
        totalResponses: stat.count,
      }),
    );

    return {
      averageScore,
      csatPercentage,
      totalSurveys,
      questionBreakdown,
    };
  }

  private createBaseFilteredTicketQuery(
    filters: DashboardFiltersDto,
  ): SelectQueryBuilder<Ticket> {
    const {
      department,
      school_period,
      issue_type,
      tags,
      start_date,
      end_date,
      priority,
    } = filters;

    const { startDate, endDate } = this.calculateDateRange(
      start_date,
      end_date,
    );

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.issue_type', 'issue_type')
      .leftJoin('ticket.school_period', 'school_period')
      .where('ticket.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (priority) {
      query.andWhere('ticket.priority = :priority', { priority });
    }

    if (department) {
      query.andWhere('department.id = :department', { department });
    }

    if (school_period) {
      query.andWhere('school_period.id = :school_period', { school_period });
    }

    if (issue_type) {
      query.andWhere('issue_type.id = :issue_type', { issue_type });
    }

    if (tags && tags.length > 0) {
      query.innerJoin('ticket.tags', 'tag_filter');
      query.andWhere('tag_filter.name IN (:...tags)', { tags });
    }

    return query;
  }

  async getTicketsByDepartmentMetrics(
    filters: DashboardFiltersDto,
  ): Promise<{ departmentName: string; count: number }[]> {
    const query = this.createBaseFilteredTicketQuery(filters);
    const rawDepartments = await query
      .select('department.name', 'departmentName')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('department.id')
      .addGroupBy('department.name')
      .getRawMany<RawDepartmentRow>();

    const allActiveDepartments = await this.departmentRepository.find({
      where: { status: true },
    });

    return allActiveDepartments.map((dept) => {
      const found = rawDepartments.find(
        (raw) => raw.departmentName === dept.name,
      );
      return {
        departmentName: dept.name,
        count: found ? Number(found.count) : 0,
      };
    });
  }

  async getTicketsByIssueTypeMetrics(
    filters: DashboardFiltersDto,
  ): Promise<{ issueTypeName: string; count: number }[]> {
    const query = this.createBaseFilteredTicketQuery(filters);
    const rawIssueTypes = await query
      .select('issue_type.name', 'issueTypeName')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('issue_type.id')
      .addGroupBy('issue_type.name')
      .getRawMany<RawIssueTypeRow>();

    const allIssueTypes = await this.issueTypeRepository.find();

    return allIssueTypes.map((type) => {
      const found = rawIssueTypes.find(
        (raw) => raw.issueTypeName === type.name,
      );
      return {
        issueTypeName: type.name,
        count: found ? Number(found.count) : 0,
      };
    });
  }
}
