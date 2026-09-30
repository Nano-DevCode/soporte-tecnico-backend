import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TechnicianKpi } from './entities/technician-kpi.entity';
import {
  FilterKpiDto,
  KpiSortBy,
  PerformanceStatus,
  SortOrder,
} from './dto/filter-kpi.dto';

@Injectable()
export class TechnicianKpiService {
  private readonly logger = new Logger(TechnicianKpiService.name);

  constructor(
    @InjectRepository(TechnicianKpi)
    private readonly kpiRepository: Repository<TechnicianKpi>,

    @InjectQueue('kpi-queue') private readonly kpiQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async triggerKpiCalculation() {
    this.logger.log('Enviando cálculo masivo de KPIs a la cola de Redis...');
    await this.kpiQueue.add('calculate-all-kpis', {});
  }

  async getTechniciansResolutionKpi(filterDto: FilterKpiDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      minAssigned,
      performanceStatus,
      sortBy,
      order = SortOrder.DESC,
    } = filterDto;

    const qb = this.kpiRepository
      .createQueryBuilder('kpi')
      .innerJoinAndSelect('kpi.staff', 'staff')
      .innerJoinAndSelect('staff.user', 'user')
      .where('user.status = :userStatus', { userStatus: true });

    // 1. Filtro de Búsqueda de Texto (searchField)
    if (query) {
      qb.andWhere(
        new Brackets((sqb) => {
          sqb
            .where('user.email ILIKE :query', { query: `%${query}%` })
            .orWhere('staff.searchField ILIKE :query', { query: `%${query}%` });
        }),
      );
    }

    // 2. Filtro por Mínimo de tickets asignados
    if (minAssigned !== undefined) {
      qb.andWhere('kpi.total_assigned >= :minAssigned', { minAssigned });
    }

    // 3. Filtro por Semáforo de Efectividad
    if (performanceStatus) {
      if (performanceStatus === PerformanceStatus.EXCELLENT) {
        qb.andWhere('kpi.effectiveness_rate >= 80');
      } else if (performanceStatus === PerformanceStatus.REGULAR) {
        qb.andWhere(
          'kpi.effectiveness_rate >= 60 AND kpi.effectiveness_rate < 80',
        );
      } else if (performanceStatus === PerformanceStatus.ATTENTION) {
        qb.andWhere('kpi.effectiveness_rate < 60');
      }
    }

    // 4. Ordenamiento Dinámico
    if (sortBy === KpiSortBy.PENDING) {
      qb.orderBy('kpi.pending_tickets', order);
    } else if (sortBy === KpiSortBy.SPEED) {
      qb.orderBy('kpi.avg_resolution_hours', order);
    } else if (sortBy === KpiSortBy.ASSIGNED) {
      qb.orderBy('kpi.total_assigned', order);
    } else {
      // Ordenamiento por defecto (Efectividad)
      qb.orderBy('kpi.effectiveness_rate', order)
        .addOrderBy('kpi.pending_tickets', 'ASC')
        .addOrderBy('kpi.avg_resolution_hours', 'ASC');
    }

    // Ejecutamos la consulta paginada
    const [kpiRecords, total] = await qb
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const staffs = kpiRecords.map((kpi) => ({
      id: kpi.staff.id,
      fullName:
        `${kpi.staff.name} ${kpi.staff.paternalSurname} ${kpi.staff.maternalSurname || ''}`.trim(),
      numControl: kpi.staff.num_control,
      email: kpi.staff.user.email,
      metrics: {
        totalAssigned: Number(kpi.total_assigned),
        totalResolved: Number(kpi.total_resolved),
        pendingTickets: Number(kpi.pending_tickets),
        effectivenessRate: Number(kpi.effectiveness_rate),
        avgResolutionHours: Number(kpi.avg_resolution_hours),
      },
    }));

    return {
      staffs,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }
}
