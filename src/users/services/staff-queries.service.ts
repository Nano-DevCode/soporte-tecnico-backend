import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { FilterStaffDto } from '../dto/staff/filter-staff.dto';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

export interface TechnicianKpiRaw {
  id: string;
  name: string;
  paternal_surname: string;
  maternal_surname: string | null;
  num_control: string;
  email: string;
  total_assigned: number | string | null;
  total_resolved: number | string | null;
  pending_tickets: number | string | null;
  effectiveness_rate: number | string | null;
}

const pendingStatuses = [TicketStatus.ASIGNADA, TicketStatus.ATENDIENDO];

@Injectable()
export class StaffQueriesService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async findAll() {
    return await this.staffRepository.find();
  }

  async findAllWithRoleSpecific(filterDto: FilterStaffDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    // 1. Inicializar el QueryBuilder
    const qb = this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roles)', {
        roles: [ValidRole.tecnico, ValidRole.coordinador, ValidRole.jefecc],
      })
      .andWhere('user.status = :status', { status: true });

    // 2. Aplicar búsqueda dinámica si existe un 'query'
    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where(
            "CONCAT(staff.name, ' ', staff.paternalSurname, ' ', staff.maternalSurname) ILIKE :search",
            { search: `%${query}%` },
          )
            .orWhere('staff.num_control ILIKE :search', {
              search: `%${query}%`,
            })
            .orWhere('staff.rfc ILIKE :search', { search: `%${query}%` });
        }),
      );
    }

    // 3. Aplicar ordenamiento ascendente (ASC)
    qb.orderBy('staff.paternalSurname', 'ASC')
      .addOrderBy('staff.maternalSurname', 'ASC')
      .addOrderBy('staff.name', 'ASC');

    // 4. Aplicar paginación (take = limit, skip = offset)
    qb.take(limit).skip(offset);

    // 5. Ejecutar consulta y obtener total
    const [staffs, total] = await qb.getManyAndCount();

    // 6. Agregar el campo "nombre completo" (fullName) a cada registro devuelto
    const staffsWithFullName = staffs.map((staff) => {
      const fullName =
        `${staff.name} ${staff.paternalSurname} ${staff.maternalSurname || ''}`.trim();
      return {
        ...staff,
        fullName,
      };
    });

    return {
      staffs: staffsWithFullName,
      meta: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllTechnicalByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];

    const staffMembers = await this.staffRepository.find({
      where: {
        id: In(uniqueIds),
        user: {
          role: {
            name: In([ValidRole.tecnico, ValidRole.coordinador]),
          },
        },
      },
      relations: {
        user: {
          role: true,
        },
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        user: {
          id: true,
          email: true,
          role: {
            name: true,
          },
        },
      },
    });

    if (staffMembers.length !== uniqueIds.length) {
      const foundIds = staffMembers.map((s) => s.id);
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `The next Ids not found: ${missingIds.join(', ')}`,
      );
    }

    return staffMembers;
  }

  async findAllTechnical() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: ValidRole.tecnico,
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        num_control: true,
        user: {
          id: true,
          email: true,
          role: {
            name: true,
          },
        },
      },
    });
  }

  async findAllTechnical2() {
    return await this.staffRepository
      .createQueryBuilder('staff')
      .innerJoin('staff.user', 'user')
      .innerJoin('user.role', 'role')
      .where('role.name IN (:...roles)', {
        roles: [ValidRole.tecnico, ValidRole.coordinador],
      })
      .andWhere('user.status = :userStatus', { userStatus: true })
      .select([
        'staff.id',
        'staff.name',
        'staff.paternalSurname',
        'staff.maternalSurname',
        'staff.num_control',
        'user.id',
        'user.email',
        'role.name',
      ])
      .loadRelationCountAndMap(
        'staff.assignTicketsCount',
        'staff.attends',
        'attend',
        (qb) => {
          qb.where('attend.is_active = :isActive', { isActive: true });
          qb.innerJoin('attend.ticket', 'ticket')
            .innerJoin('ticket.ticket_histories', 'currentHistory')
            .innerJoin('currentHistory.status', 'status')
            .andWhere(
              `NOT EXISTS (
                SELECT 1 FROM ticket_history newerHistory 
                WHERE newerHistory."ticketId" = "ticket"."id" 
                AND newerHistory.created_at > "currentHistory"."created_at"
              )`,
            )
            .andWhere('status.code IN (:...pendingStatuses)', {
              pendingStatuses,
            });

          return qb;
        },
      )
      .getMany();
  }

  async findAllCoordinators() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: ValidRole.coordinador,
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
        coordination: true,
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        user: {
          id: true,
          email: true,
          role: {
            name: true,
          },
        },
        coordination: {
          id: true,
          name: true,
        },
      },
    });
  }

  async findAllDepartmentManagers() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: In([ValidRole.jefe, ValidRole.planning]),
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
        department: true,
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        user: {
          id: true,
          email: true,
          role: {
            name: true,
          },
        },
        department: true,
      },
    });
  }

  async findAllBossCCContact() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: ValidRole.jefecc,
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        idTelegram: true,
        user: {
          id: true,
          email: true,
        },
      },
    });
  }

  async findAllUserForNotification() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: In([ValidRole.superAdmin, ValidRole.secretaria]),
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        idTelegram: true,
        user: {
          id: true,
          email: true,
        },
      },
    });
  }

  async findAllPlaningBossContact() {
    return await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: ValidRole.planning,
          },
          status: true,
        },
      },
      relations: {
        user: {
          role: true,
        },
      },
      select: {
        id: true,
        name: true,
        paternalSurname: true,
        maternalSurname: true,
        idTelegram: true,
        user: {
          id: true,
          email: true,
        },
      },
    });
  }

  async getTechniciansResolutionKpi(filterDto: FilterStaffDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const qb = this.staffRepository
      .createQueryBuilder('staff')
      .innerJoinAndSelect('staff.user', 'user')
      .innerJoinAndSelect('user.role', 'role')
      .leftJoin('staff.attends', 'attend')
      .leftJoin('attend.ticket', 'ticket')
      .leftJoin(
        'ticket.technical_reports',
        'report',
        'report.is_resolved = :isResolved',
        { isResolved: true },
      )
      .where('role.name = :roleName', { roleName: ValidRole.tecnico })
      .andWhere('user.status = :userStatus', { userStatus: true });

    if (query) {
      qb.andWhere(
        new Brackets((sqb) => {
          sqb
            .where(
              "CONCAT(staff.name, ' ', staff.paternalSurname, ' ', staff.maternalSurname) ILIKE :search",
              { search: `%${query}%` },
            )
            .orWhere('staff.num_control ILIKE :search', {
              search: `%${query}%`,
            });
        }),
      );
    }

    qb.select([
      'staff.id AS id',
      'staff.name AS name',
      'staff.paternalSurname AS paternal_surname',
      'staff.maternalSurname AS maternal_surname',
      'staff.num_control AS num_control',
      'user.email AS email',
    ])
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
      .groupBy('staff.id')
      .addGroupBy('user.id');

    qb.orderBy('effectiveness_rate', 'DESC', 'NULLS LAST').addOrderBy(
      'pending_tickets',
      'ASC',
    );

    const total = await qb.getCount();
    qb.limit(limit).offset(offset);

    const rawResults = await qb.getRawMany<TechnicianKpiRaw>();

    const staffs = rawResults.map((item) => {
      return {
        id: item.id,
        fullName:
          `${item.name} ${item.paternal_surname} ${item.maternal_surname || ''}`.trim(),
        numControl: item.num_control,
        email: item.email,
        metrics: {
          totalAssigned: Number(item.total_assigned ?? 0),
          totalResolved: Number(item.total_resolved ?? 0),
          pendingTickets: Number(item.pending_tickets ?? 0),
          effectivenessRate: Number(item.effectiveness_rate ?? 0),
        },
      };
    });

    return {
      staffs,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
