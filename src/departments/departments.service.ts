import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { FilterDepartmentDto } from './dto/filter-department.dto';
import { ChangeDepartmentStatusDto } from './dto/change-status.dto';
import { I18nService } from 'nestjs-i18n';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger('DepartmentsService');
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly i18: I18nService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      const department = this.departmentRepository.create(createDepartmentDto);
      return await this.departmentRepository.save(department);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const departments = await this.departmentRepository.find();
    return departments;
  }

  async findAllFilter(filterDto: FilterDepartmentDto) {
    const { limit = 10, offset = 0, query, status } = filterDto;

    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');

    if (query) {
      queryBuilder.andWhere(
        'unaccent(LOWER(department.name)) LIKE unaccent(LOWER(:name))',
        {
          name: `%${query.toLowerCase()}%`,
        },
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('department.status = :status', { status });
    }

    const [departments, total] = await queryBuilder
      .orderBy('department.id', 'ASC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      data: departments,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const department = await this.departmentRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        acronym: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!department) {
      throw new NotFoundException(
        this.i18.t('errors.department.departmentNotFound', { args: { id } }),
      );
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const departmentToUpdate = await this.departmentRepository.preload({
      id,
      ...updateDepartmentDto,
    });
    if (!departmentToUpdate) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    try {
      await this.departmentRepository.save(departmentToUpdate);
      return await this.findOne(id);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const department = await this.findOne(id);
    return await this.departmentRepository.remove(department);
  }

  async deactivate(id: string) {
    return this.changeStatus(id, { status: false });
  }

  async activate(id: string) {
    return this.changeStatus(id, { status: true });
  }

  async changeStatus(id: string, changeStatusDto: ChangeDepartmentStatusDto) {
    const result = await this.departmentRepository.update(id, {
      status: changeStatusDto.status,
    });
    if (result.affected === 0)
      throw new NotFoundException(
        this.i18.t('errors.department.departmentNotFound', { args: { id } }),
      );
    return { id, ...changeStatusDto };
  }

  async deleteAllDepartments() {
    try {
      await this.departmentRepository.deleteAll();
      return { deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown) {
    const dbError = error as DatabaseError;

    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18.t('errors.deparment.nameAlreadyExists'),
        );
      }
      if (dbError.detail?.includes('(acronym)=')) {
        throw new ConflictException(
          this.i18.t('errors.deparment.acronymAlreadyExists'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    throw new InternalServerErrorException(
      this.i18.t('errors.internalServerError'),
    );
  }
}
