import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSchoolPeriodDto } from './dto/create-school-period.dto';
import { UpdateSchoolPeriodDto } from './dto/update-school-period.dto';
import { EntityManager, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { PeriodSuffix, SchoolPeriod } from './entities/school-period.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { PaginatedResponse } from 'src/common/pagination/interfaces/paginationResponse.interface';
import { PAGINATION } from 'src/common/constants/pagination.constants';
import { FilterSchoolPeriodDto } from './dto/filter-school-period.dto';
import { I18nService } from 'nestjs-i18n';
import { DatabaseError } from 'src/interfaces/DatabaseError';

@Injectable()
export class SchoolPeriodsService {
  constructor(
    @InjectRepository(SchoolPeriod)
    private readonly schoolPeriodsRepository: Repository<SchoolPeriod>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createSchoolPeriodDto: CreateSchoolPeriodDto,
  ): Promise<SchoolPeriod> {
    const startDate = new Date(createSchoolPeriodDto.date_start);
    const endDate = new Date(createSchoolPeriodDto.date_end);
    if (endDate.getTime() <= startDate.getTime()) {
      throw new BadRequestException(
        this.i18n.t('errors.school_periods.invalid_dates'),
      );
    }

    const schoolPeriod = this.schoolPeriodsRepository.create(
      createSchoolPeriodDto,
    );
    try {
      return await this.schoolPeriodsRepository.save(schoolPeriod);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async findAll(
    filterSchoolPeriodDto: FilterSchoolPeriodDto,
  ): Promise<PaginatedResponse<SchoolPeriod>> {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      is_active,
    } = filterSchoolPeriodDto;
    const offset = (page - 1) * limit;
    const cleanSearch = filterSchoolPeriodDto.search?.trim();

    const where: FindOptionsWhere<SchoolPeriod> = {};

    if (cleanSearch) {
      where.name = ILike(`%${cleanSearch}%`);
    }
    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await this.schoolPeriodsRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: {
        created_at: 'DESC',
      },
    });

    return PaginationResponse({ data, total }, filterSchoolPeriodDto);
  }

  async findAllForSelect(): Promise<SchoolPeriod[]> {
    const data = await this.schoolPeriodsRepository.find({
      select: {
        id: true,
        name: true,
        created_at: true,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return data;
  }

  async findOne(id: string): Promise<SchoolPeriod> {
    const schoolPeriod = await this.schoolPeriodsRepository.findOneBy({ id });

    if (!schoolPeriod) {
      throw new NotFoundException(
        this.i18n.t('errors.school_periods.not_found', {
          args: { id },
        }),
      );
    }

    return schoolPeriod;
  }

  async update(
    id: string,
    updateSchoolPeriodDto: UpdateSchoolPeriodDto,
  ): Promise<SchoolPeriod> {
    const schoolPeriod = await this.findOne(id);

    const projectedDateStart =
      updateSchoolPeriodDto.date_start ?? schoolPeriod.date_start;
    const projectedPeriodType =
      updateSchoolPeriodDto.period_type ?? schoolPeriod.period_type;

    const newYear = new Date(projectedDateStart).getFullYear();
    const newSuffix = PeriodSuffix[projectedPeriodType];
    const projectedName = `${newYear}${newSuffix}`;

    if (schoolPeriod.name !== projectedName) {
      const ticketsCount = await this.schoolPeriodsRepository
        .createQueryBuilder('period')
        .innerJoin('period.tickets', 'tickets')
        .where('period.id = :id', { id })
        .getCount();

      if (ticketsCount > 0) {
        throw new ConflictException(
          this.i18n.t('errors.school_periods.cannot_update_name_with_tickets'),
        );
      }
    }

    if (
      updateSchoolPeriodDto.is_active === true &&
      schoolPeriod.is_active === false
    ) {
      const activePeriod = await this.getActiveSchoolPeriod();
      if (activePeriod && activePeriod.id !== schoolPeriod.id) {
        throw new ConflictException(
          this.i18n.t('errors.school_periods.already_active', {
            args: { name: activePeriod.name },
          }),
        );
      }
    }

    this.schoolPeriodsRepository.merge(schoolPeriod, updateSchoolPeriodDto);

    const startDate = new Date(schoolPeriod.date_start);
    const endDate = new Date(schoolPeriod.date_end);
    if (endDate.getTime() <= startDate.getTime()) {
      throw new BadRequestException(
        this.i18n.t('errors.school_periods.invalid_dates'),
      );
    }

    try {
      return await this.schoolPeriodsRepository.save(schoolPeriod);
    } catch (error) {
      this.handleDBErrors(error as DatabaseError);
    }
  }

  async remove(id: string): Promise<SchoolPeriod> {
    const schoolPeriod = await this.findOne(id);
    await this.schoolPeriodsRepository.remove(schoolPeriod);
    return schoolPeriod;
  }

  async activateSchoolPeriod(id: string): Promise<SchoolPeriod> {
    const schoolPeriod = await this.findOne(id);

    if (schoolPeriod.is_active) {
      return schoolPeriod;
    }

    const activePeriod = await this.getActiveSchoolPeriod();

    if (activePeriod) {
      throw new ConflictException(
        this.i18n.t('errors.school_periods.already_active', {
          args: { name: activePeriod.name },
        }),
      );
    }

    schoolPeriod.is_active = true;
    return await this.schoolPeriodsRepository.save(schoolPeriod);
  }

  async deactivateSchoolPeriod(id: string): Promise<SchoolPeriod> {
    const schoolPeriod = await this.findOne(id);

    if (!schoolPeriod.is_active) {
      return schoolPeriod;
    }

    schoolPeriod.is_active = false;
    return await this.schoolPeriodsRepository.save(schoolPeriod);
  }

  async getActiveSchoolPeriod(
    transactionManager?: EntityManager,
  ): Promise<SchoolPeriod | null> {
    const manager = transactionManager || this.schoolPeriodsRepository.manager;
    return await manager.findOneBy(SchoolPeriod, {
      is_active: true,
    });
  }

  async getActiveSchoolPeriodOrFail(
    transactionManager?: EntityManager,
  ): Promise<SchoolPeriod> {
    const activePeriod = await this.getActiveSchoolPeriod(transactionManager);

    if (!activePeriod) {
      throw new NotFoundException(
        this.i18n.t('errors.school_periods.no_active_period'),
      );
    }

    return activePeriod;
  }

  private handleDBErrors(dbeError: any): never {
    const error = dbeError as DatabaseError;

    if (error.code === '23505') {
      throw new ConflictException(
        this.i18n.t('errors.school_periods.name_already_exists'),
      );
    }
    throw error;
  }
}
