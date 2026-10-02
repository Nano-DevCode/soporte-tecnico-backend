import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Ticket } from '../../entities/ticket.entity';
import { Status, TicketHistory } from 'src/ticket-history/entities';
import {
  PeriodType,
  SchoolPeriod,
} from 'src/school-periods/entities/school-period.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { Staff } from 'src/users/entities/staff.entity';
import { Attend } from 'src/attends/entities/attend.entity';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import {
  SEED_ISSUE_TYPES,
  SEED_TAGS,
  SEED_TICKET_STATUSES,
  SEED_TICKETS,
} from '../data/tickets-seed.data';

@Injectable()
export class TicketsSeedService {
  private readonly logger = new Logger(TicketsSeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async runSeed(): Promise<{
    complete: boolean;
    message: string;
    totalTickets: number;
    tickets: string[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificación de Idempotencia: No duplicar si ya existen tickets
      const existingTickets = await queryRunner.manager.count(Ticket);
      if (existingTickets > 0) {
        throw new ConflictException(
          'El seed de tickets ya fue ejecutado anteriormente y existen registros en la base de datos.',
        );
      }

      // 2. Sembrado / Aseguramiento de dependencias de catálogo
      const statusMap = await this.ensureStatuses(queryRunner);
      const issueTypeMap = await this.ensureIssueTypes(queryRunner);
      const tagMap = await this.ensureTags(queryRunner);
      const schoolPeriod = await this.ensureSchoolPeriod(queryRunner);

      // 3. Obtención del personal requerido (Jefe de Depto, Coordinador, Técnico)
      const { jefeDepto, coordinador, tecnico } =
        await this.resolveStaffMembers(queryRunner);

      // 4. Creación iterativa de tickets con historial y asignaciones
      const createdFolios: string[] = [];

      for (const item of SEED_TICKETS) {
        const issueType = issueTypeMap.get(item.issueTypeName);
        const targetStatus = statusMap.get(item.statusCode);
        const tags = item.tagNames
          .map((name) => tagMap.get(name))
          .filter((t): t is Tag => !!t);

        if (!targetStatus) {
          throw new BadRequestException(
            `Estado "${item.statusCode}" no encontrado en el catálogo de estados.`,
          );
        }
        if (!issueType) {
          throw new BadRequestException(
            `Tipo de problema "${item.issueTypeName}" no encontrado.`,
          );
        }

        const ticket = queryRunner.manager.create(Ticket, {
          folio: item.folio,
          description: item.description,
          affected_name: item.affected_name,
          contact_email: item.contact_email,
          available_hours: item.available_hours,
          equipment_location: item.equipment_location,
          priority: item.priority,
          school_period: schoolPeriod,
          issue_type: issueType,
          jefe_depto: jefeDepto,
          coordinator: coordinador,
          tags,
        });

        const savedTicket = await queryRunner.manager.save(Ticket, ticket);

        // 5. Crear el historial de estado inicial
        const history = queryRunner.manager.create(TicketHistory, {
          ticket: savedTicket,
          status: targetStatus,
          created_at: new Date(),
        });
        await queryRunner.manager.save(TicketHistory, history);

        // 6. Si el ticket está asignado o en atención, crear el registro de Attend
        if (
          item.statusCode === TicketStatus.ASIGNADA ||
          item.statusCode === TicketStatus.ATENDIENDO ||
          item.statusCode === TicketStatus.SOLUCIONADA ||
          item.statusCode === TicketStatus.CERRADA
        ) {
          const isAttending = item.statusCode === TicketStatus.ATENDIENDO;
          const attend = queryRunner.manager.create(Attend, {
            ticket: savedTicket,
            technician: tecnico,
            is_active: true,
            is_attending: isAttending,
            assigned_at: new Date(),
          });
          await queryRunner.manager.save(Attend, attend);
        }

        createdFolios.push(savedTicket.folio);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Seed de tickets ejecutado con éxito: ${createdFolios.length} tickets creados.`,
      );

      return {
        complete: true,
        message: 'Seed de tickets ejecutado exitosamente.',
        totalTickets: createdFolios.length,
        tickets: createdFolios,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al ejecutar el seed de tickets', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async ensureStatuses(queryRunner: any): Promise<Map<string, Status>> {
    const statusMap = new Map<string, Status>();
    const existing = await queryRunner.manager.find(Status);

    for (const status of existing) {
      statusMap.set(status.code, status);
    }

    for (const item of SEED_TICKET_STATUSES) {
      if (!statusMap.has(item.code)) {
        const created = queryRunner.manager.create(Status, {
          name: item.name,
          code: item.code,
        });
        const saved = await queryRunner.manager.save(Status, created);
        statusMap.set(saved.code, saved);
      }
    }

    return statusMap;
  }

  private async ensureIssueTypes(
    queryRunner: any,
  ): Promise<Map<string, IssueType>> {
    const map = new Map<string, IssueType>();
    const existing = await queryRunner.manager.find(IssueType);

    for (const it of existing) {
      map.set(it.name, it);
    }

    for (const item of SEED_ISSUE_TYPES) {
      if (!map.has(item.name)) {
        const created = queryRunner.manager.create(IssueType, {
          name: item.name,
          description: item.description,
        });
        const saved = await queryRunner.manager.save(IssueType, created);
        map.set(saved.name, saved);
      }
    }

    return map;
  }

  private async ensureTags(queryRunner: any): Promise<Map<string, Tag>> {
    const map = new Map<string, Tag>();
    const existing = await queryRunner.manager.find(Tag);

    for (const tag of existing) {
      map.set(tag.name, tag);
    }

    for (const tagName of SEED_TAGS) {
      if (!map.has(tagName)) {
        const created = queryRunner.manager.create(Tag, { name: tagName });
        const saved = await queryRunner.manager.save(Tag, created);
        map.set(saved.name, saved);
      }
    }

    return map;
  }

  private async ensureSchoolPeriod(queryRunner: any): Promise<SchoolPeriod> {
    let period = await queryRunner.manager.findOne(SchoolPeriod, {
      where: { is_active: true },
    });

    if (!period) {
      period = queryRunner.manager.create(SchoolPeriod, {
        name: '20261',
        period_type: PeriodType.ENERO_JUNIO,
        date_start: new Date('2026-01-15T08:00:00.000Z'),
        date_end: new Date('2026-06-30T20:00:00.000Z'),
        is_active: true,
      });
      period = await queryRunner.manager.save(SchoolPeriod, period);
    }

    return period;
  }

  private async resolveStaffMembers(
    queryRunner: any,
  ): Promise<{ jefeDepto: Staff; coordinador: Staff; tecnico: Staff }> {
    const allStaff = await queryRunner.manager.find(Staff, {
      relations: ['user', 'user.role'],
    });

    if (!allStaff || allStaff.length === 0) {
      throw new BadRequestException(
        'No hay personal registrado en el sistema. Debe ejecutar primero el seed de usuarios (user-seed).',
      );
    }

    const jefeDepto =
      allStaff.find(
        (s: any) =>
          s.user?.role?.name === 'jefe_depto' || s.user?.role?.name === 'admin',
      ) || allStaff[0];

    const coordinador =
      allStaff.find(
        (s: any) =>
          s.user?.role?.name === 'coordinador' ||
          s.user?.role?.name === 'superAdmin',
      ) ||
      allStaff[1] ||
      allStaff[0];

    const tecnico =
      allStaff.find((s: any) => s.user?.role?.name === 'tecnico') ||
      allStaff[2] ||
      allStaff[0];

    return { jefeDepto, coordinador, tecnico };
  }
}
