import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async recordLog(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditRepository.create(data);
    return await this.auditRepository.save(log);
  }

  async findAll(filterDto: FilterAuditLogsDto) {
    const {
      limit = 10,
      offset = 0,
      entityName,
      entityId,
      action,
      performedBy,
      startDate,
      endDate,
    } = filterDto;

    const qb = this.auditRepository.createQueryBuilder('audit');

    if (entityName) {
      qb.andWhere('audit.entityName = :entityName', { entityName });
    }

    if (entityId) {
      qb.andWhere('audit.entityId = :entityId', { entityId });
    }

    if (action) {
      qb.andWhere('audit.action = :action', { action });
    }

    if (performedBy) {
      qb.andWhere('audit.performedBy = :performedBy', { performedBy });
    }

    if (startDate) {
      qb.andWhere('audit.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      qb.andWhere('audit.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const [logs, total] = await qb
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      data: logs,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(
    entityName: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { entityName, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<AuditLog> {
    const log = await this.auditRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(
        `Registro de auditoría con ID ${id} no encontrado`,
      );
    }
    return log;
  }
}
