import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Brackets, In, Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { FilterStaffDto } from './dto/filter-staff.dto';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

interface DatabaseError extends Error {
  code?: string | number;
  detail?: string;
}

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
export class StaffService {
  private readonly logger = new Logger('StaffService');
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async create(createStaffDto: CreateStaffDto) {
    const staff = this.staffRepository.create(createStaffDto);
    try {
      const result = await this.staffRepository.save(staff);
      return result;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

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
          // Usamos CONCAT para unir los 3 campos en la BD y permitir búsquedas por nombre completo
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
      // Unimos las partes y usamos .trim() por si algún usuario no tiene apellido materno y queda un espacio extra
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

  async findOne(id: string) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${id} not found`);
    }
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staffToUpdate = await this.staffRepository.preload(updateStaffDto);

    if (!staffToUpdate) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      await this.staffRepository.save(staffToUpdate);
      return staffToUpdate;
    } catch (error) {
      this.handleDBExeptions(error);
    }
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
      // Ajustamos el select a campos que REALMENTE existen en Staff y User
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
    const technicalStaff = await this.staffRepository.find({
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
        num_control: true, // Agregado por si lo necesitas
        user: {
          id: true,
          email: true,
          role: {
            name: true,
          },
        },
      },
    });

    return technicalStaff;
  }

  async findAllTechnical2() {
    const technicalStaff = await this.staffRepository
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

    return technicalStaff;
  }

  async deleteAllStaffs() {
    try {
      await this.staffRepository.query(`
        TRUNCATE TABLE "staff", "user" CASCADE;
      `);
      return { deleted: true };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAllCoordinators() {
    const coordinators = await this.staffRepository.find({
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

    return coordinators;
  }

  async findAllDepartmentManagers() {
    const departmentManagers = await this.staffRepository.find({
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
    return departmentManagers;
  }

  async findAllBossCCContact() {
    const departmentManagers = await this.staffRepository.find({
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
    return departmentManagers;
  }
  async findAllUserForNotification() {
    const usersForNotification = await this.staffRepository.find({
      where: {
        user: {
          role: {
            name: In([
              ValidRole.superAdmin,
              ValidRole.secretaria,
              // ValidRole.inventory,
            ]),
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
    return usersForNotification;
  }

  async findAllPlaningBossContact() {
    const departmentManagers = await this.staffRepository.find({
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
    return departmentManagers;
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

    // Ordenamiento por efectividad
    qb.orderBy('effectiveness_rate', 'DESC', 'NULLS LAST').addOrderBy(
      'pending_tickets',
      'ASC',
    );

    const total = await qb.getCount();

    qb.limit(limit).offset(offset);

    // AQUÍ INYECTAMOS TU INTERFAZ
    const rawResults = await qb.getRawMany<TechnicianKpiRaw>();

    // TypeScript ahora sabe exactamente qué es 'item'
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

  async syncSearchFields() {
    this.logger.log('Iniciando sincronización de searchField para Staff...');

    const allStaff = await this.staffRepository.find();
    let updatedCount = 0;

    for (const staff of allStaff) {
      const rawString = `${staff.name || ''} ${staff.paternalSurname || ''} ${staff.maternalSurname || ''} ${staff.num_control || ''}`;

      staff.searchField = rawString
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

      await this.staffRepository.save(staff);
      updatedCount++;
    }

    this.logger.log(
      `Sincronización completada. ${updatedCount} registros actualizados.`,
    );
    return {
      message: 'Sincronización de campos de búsqueda completada con éxito',
      updatedRecords: updatedCount,
    };
  }

  private handleDBExeptions(error: unknown) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check the server logs',
    );
  }
}
