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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppCacheService } from 'src/common/services/app-cache.service';

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
    private readonly cacheService: AppCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      const department = this.departmentRepository.create(createDepartmentDto);
      const saved = await this.departmentRepository.save(department);
      await this.cacheService.delByPattern('catalog:departments:*');
      this.eventEmitter.emit('department.created', saved);
      return saved;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    return this.cacheService.wrap(
      'catalog:departments:all',
      async () => {
        const departments = await this.departmentRepository.find();
        return departments;
      },
      600,
    );
  }

  async findAllFilter(filterDto: FilterDepartmentDto) {
    const cacheKey = this.cacheService.generateKey(
      'catalog:departments:filter',
      filterDto as Record<string, any>,
    );
    return this.cacheService.wrap(
      cacheKey,
      async () => {
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
      },
      300,
    );
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
      await this.cacheService.delByPattern('catalog:departments:*');
      this.eventEmitter.emit('department.updated', {
        id,
        ...updateDepartmentDto,
      });
      return await this.findOne(id);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const department = await this.findOne(id);
    const removed = await this.departmentRepository.remove(department);
    await this.cacheService.delByPattern('catalog:departments:*');
    this.eventEmitter.emit('department.removed', { id });
    return removed;
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
    await this.cacheService.delByPattern('catalog:departments:*');
    this.eventEmitter.emit('department.statusChanged', {
      id,
      ...changeStatusDto,
    });
    return { id, ...changeStatusDto };
  }

  async deleteAllDepartments() {
    try {
      await this.departmentRepository.deleteAll();
      await this.cacheService.delByPattern('catalog:departments:*');
      this.eventEmitter.emit('department.cleared', {});
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
