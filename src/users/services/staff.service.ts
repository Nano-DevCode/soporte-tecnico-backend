import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterStaffDto } from '../dto/staff/filter-staff.dto';
import { StaffQueriesService } from './staff-queries.service';

interface DatabaseError extends Error {
  code?: string | number;
  detail?: string;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly staffQueriesService: StaffQueriesService,
  ) {}

  /**
   * Crea un nuevo registro de empleado (Staff).
   */
  async create(createStaffDto: CreateStaffDto) {
    const staff = this.staffRepository.create(createStaffDto);
    try {
      return await this.staffRepository.save(staff);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Busca un empleado por su ID.
   */
  async findOne(id: string) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${id} not found`);
    }
    return staff;
  }

  /**
   * Actualiza los datos de un empleado.
   */
  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staffToUpdate = await this.staffRepository.preload(updateStaffDto);

    if (!staffToUpdate) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      await this.staffRepository.save(staffToUpdate);
      return staffToUpdate;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Trunca las tablas staff y user.
   */
  async deleteAllStaffs() {
    try {
      await this.staffRepository.query(`
        TRUNCATE TABLE "staff", "user" CASCADE;
      `);
      return { deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Sincroniza y normaliza el campo searchField para todos los registros de Staff.
   */
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

  // --- Delegación de consultas a StaffQueriesService (Clean Architecture / SRP) ---

  findAll() {
    return this.staffQueriesService.findAll();
  }

  findAllWithRoleSpecific(filterDto: FilterStaffDto) {
    return this.staffQueriesService.findAllWithRoleSpecific(filterDto);
  }

  findAllTechnicalByIds(ids: string[]) {
    return this.staffQueriesService.findAllTechnicalByIds(ids);
  }

  findAllTechnical() {
    return this.staffQueriesService.findAllTechnical();
  }

  findAllTechnical2() {
    return this.staffQueriesService.findAllTechnical2();
  }

  findAllCoordinators() {
    return this.staffQueriesService.findAllCoordinators();
  }

  findAllDepartmentManagers() {
    return this.staffQueriesService.findAllDepartmentManagers();
  }

  findAllBossCCContact() {
    return this.staffQueriesService.findAllBossCCContact();
  }

  findAllUserForNotification() {
    return this.staffQueriesService.findAllUserForNotification();
  }

  findAllPlaningBossContact() {
    return this.staffQueriesService.findAllPlaningBossContact();
  }

  getTechniciansResolutionKpi(filterDto: FilterStaffDto) {
    return this.staffQueriesService.getTechniciansResolutionKpi(filterDto);
  }

  private handleDBExceptions(error: unknown) {
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
