import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Job } from 'bull';
import { Staff } from 'src/staff/entities/staff.entity';
import { TechnicianKpi } from './entities/technician-kpi.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

export interface TechnicianKpiRaw {
  id: string;
  total_assigned: string | number | null;
  total_resolved: string | number | null;
  pending_tickets: string | number | null;
  effectiveness_rate: string | number | null;
  avg_resolution_hours: string | number | null;
}

@Processor('kpi-queue')
export class TechnicianKpiProcessor {
  private readonly logger = new Logger(TechnicianKpiProcessor.name);

  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(TechnicianKpi)
    private readonly kpiRepository: Repository<TechnicianKpi>,
  ) {}

  @Process('calculate-all-kpis')
  async handleProcess(job: Job): Promise<any> {
    this.logger.log(`Procesando trabajo: ${job.name} (ID: ${job.id})`);

    try {
      const qb = this.staffRepository
        .createQueryBuilder('staff')
        .innerJoin('staff.user', 'user')
        .innerJoin('user.role', 'role')
        .leftJoin('staff.attends', 'attend')
        .leftJoin('attend.ticket', 'ticket')
        .leftJoin(
          'ticket.technical_reports',
          'report',
          'report.is_resolved = :isResolved',
          { isResolved: true },
        )
        .where('role.name = :roleName', { roleName: ValidRole.tecnico })
        .andWhere('user.status = :userStatus', { userStatus: true })

        .select(['staff.id AS id'])
        .addSelect('COUNT(DISTINCT attend.id)::int', 'total_assigned')
        .addSelect(
          'COUNT(DISTINCT CASE WHEN report.id IS NOT NULL THEN ticket.id ELSE NULL END)::int',
          'total_resolved',
        )
        .addSelect(
          '(COUNT(DISTINCT attend.id) - COUNT(DISTINCT CASE WHEN report.id IS NOT NULL THEN ticket.id ELSE NULL END))::int',
          'pending_tickets',
        )
        .addSelect(
          'COALESCE(ROUND((COUNT(DISTINCT CASE WHEN report.id IS NOT NULL THEN ticket.id ELSE NULL END)::decimal / NULLIF(COUNT(DISTINCT attend.id), 0)) * 100, 2), 0)',
          'effectiveness_rate',
        )
        .addSelect(
          'COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (report.created_at - attend.assigned_at)) / 3600)::numeric, 2), 0)',
          'avg_resolution_hours',
        )
        .groupBy('staff.id');

      const rawResults = await qb.getRawMany<TechnicianKpiRaw>();

      const kpisToSave = rawResults.map((item) => {
        return this.kpiRepository.create({
          staffId: item.id,
          total_assigned: Number(item.total_assigned ?? 0),
          total_resolved: Number(item.total_resolved ?? 0),
          pending_tickets: Number(item.pending_tickets ?? 0),
          effectiveness_rate: Number(item.effectiveness_rate ?? 0),
          avg_resolution_hours: Number(item.avg_resolution_hours ?? 0),
        });
      });

      if (kpisToSave.length > 0) {
        await this.kpiRepository.upsert(kpisToSave, ['staffId']);
      }

      this.logger.log(`Éxito: ${kpisToSave.length} técnicos actualizados.`);
      return { success: true, processed: kpisToSave.length };
    } catch (error) {
      this.logger.error('Error calculando KPIs:', error);
      throw error;
    }
  }
}
