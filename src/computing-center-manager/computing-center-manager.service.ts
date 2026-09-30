import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateComputingCenterManagerDto } from './dto/create-computing-center-manager.dto';
import { UpdateComputingCenterManagerDto } from './dto/update-computing-center-manager.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ComputingCenterManager } from './entities/computing-center-manager.entity';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { PAGINATION } from 'src/common/constants/pagination.constants';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { FilterComputingCenterManagerDto } from './dto/filter-computing-center-managers.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ComputingCenterManagerService {
  constructor(
    @InjectRepository(ComputingCenterManager)
    private readonly computingCenterManagerRepository: Repository<ComputingCenterManager>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createComputingCenterManagerDto: CreateComputingCenterManagerDto,
  ) {
    try {
      const manager = this.computingCenterManagerRepository.create(
        createComputingCenterManagerDto,
      );
      return await this.computingCenterManagerRepository.save(manager);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const dbError = error.driverError as { code: string; detail?: string };

        if (dbError.code === '23505') {
          const message = this.i18n.t('errors.manager.duplicate');
          throw new ConflictException(message);
        }
      }
      throw error;
    }
  }

  async findAll(
    filterComputingCenterManagerDto: FilterComputingCenterManagerDto,
  ) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
      is_active,
    } = filterComputingCenterManagerDto;

    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();
    const baseConditions: FindOptionsWhere<ComputingCenterManager> = {};

    if (is_active !== undefined) {
      baseConditions.is_active = is_active;
    }

    let where:
      | FindOptionsWhere<ComputingCenterManager>
      | FindOptionsWhere<ComputingCenterManager>[] = baseConditions;
    if (cleanSearch) {
      where = [
        { ...baseConditions, names: ILike(`%${cleanSearch}%`) },
        { ...baseConditions, first_last_name: ILike(`%${cleanSearch}%`) },
        { ...baseConditions, second_last_name: ILike(`%${cleanSearch}%`) },
        { ...baseConditions, rfc: ILike(`%${cleanSearch}%`) },
      ];
    }
    const [data, total] =
      await this.computingCenterManagerRepository.findAndCount({
        where,
        take: limit,
        skip: offset,
        order: {
          is_active: 'DESC',
          created_at: 'DESC',
        },
      });

    return PaginationResponse({ data, total }, filterComputingCenterManagerDto);
  }

  async findOne(id: string) {
    const manager = await this.computingCenterManagerRepository.findOneBy({
      id,
    });

    if (!manager) {
      const message = this.i18n.t('errors.manager.not_found_id', {
        args: { id },
      });
      throw new NotFoundException(message);
    }

    return manager;
  }

  async update(
    id: string,
    updateComputingCenterManagerDto: UpdateComputingCenterManagerDto,
  ) {
    const manager = await this.findOne(id);
    this.computingCenterManagerRepository.merge(
      manager,
      updateComputingCenterManagerDto,
    );
    return await this.computingCenterManagerRepository.save(manager);
  }

  // async remove(id: string) {
  //   const manager = await this.findOne(id);
  //   await this.computingCenterManagerRepository.remove(manager);
  //   return manager;
  // }

  async activateManager(id: string): Promise<ComputingCenterManager> {
    const manager = await this.findOne(id);

    if (manager.is_active) {
      return manager;
    }

    const activeManager = await this.getActiveManager();

    if (activeManager) {
      const fullName = `${activeManager.names} ${activeManager.first_last_name} ${activeManager.second_last_name}`;
      const message = this.i18n.t('errors.manager.already_active', {
        args: { name: fullName },
      });
      throw new ConflictException(message);
    }

    manager.is_active = true;
    return await this.computingCenterManagerRepository.save(manager);
  }

  async deactivateManager(id: string): Promise<ComputingCenterManager> {
    const manager = await this.findOne(id);

    if (!manager.is_active) {
      return manager;
    }

    manager.is_active = false;
    return await this.computingCenterManagerRepository.save(manager);
  }

  async getActiveManager(
    transactionManager?: EntityManager,
  ): Promise<ComputingCenterManager | null> {
    const manager =
      transactionManager || this.computingCenterManagerRepository.manager;
    return await manager.findOne(ComputingCenterManager, {
      where: {
        is_active: true,
      },
    });
  }

  async getActiveManagerOrFail(
    transactionManager?: EntityManager,
  ): Promise<ComputingCenterManager> {
    const managerDb =
      transactionManager || this.computingCenterManagerRepository.manager;
    const manager = await this.getActiveManager(managerDb);
    if (!manager) {
      const message = this.i18n.t('errors.manager.no_active_found');
      throw new NotFoundException(message);
    }
    return manager;
  }
}
