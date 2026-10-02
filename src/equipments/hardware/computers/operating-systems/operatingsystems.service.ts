import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { CreateOperatingsystemDto } from './dto/create-operatingsystem.dto';
import { UpdateOperatingsystemDto } from './dto/update-operatingsystem.dto';
import { Operatingsystem } from './entities/operatingsystem.entity';
import { FilterOperatingSystemDto } from './dto/filter-operatingsystem.dto';

@Injectable()
export class OperatingsystemsService {
  private readonly logger = new Logger(OperatingsystemsService.name);

  constructor(
    @InjectRepository(Operatingsystem)
    private readonly operatingSystemRepository: Repository<Operatingsystem>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR ---
  async create(createOperatingsystemDto: CreateOperatingsystemDto) {
    const normalizedName = this.cleanString(createOperatingsystemDto.name);

    if (normalizedName.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'name', constraints: [2] },
        }),
      );
    }
    if (normalizedName.length > 200) {
      throw new BadRequestException(
        this.i18n.t('validation.maxLength', {
          args: { property: 'name', constraints: [200] },
        }),
      );
    }

    const existing = await this.operatingSystemRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.operatingSystems.osAlreadyExists'),
      );
    }

    try {
      const operatingSystem = this.operatingSystemRepository.create({
        ...createOperatingsystemDto,
        name: normalizedName,
      });
      return await this.operatingSystemRepository.save(operatingSystem);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateOperatingsystemDto: UpdateOperatingsystemDto) {
    const { name } = updateOperatingsystemDto;

    const operatingSystem = await this.operatingSystemRepository.preload({
      id,
    });

    if (!operatingSystem) {
      throw new NotFoundException(
        this.i18n.t('errors.operatingSystems.osNotFound', { args: { id } }),
      );
    }

    const hasName = name && name.trim().length > 0;

    if (hasName) {
      const normalizedName = this.cleanString(name);

      if (normalizedName.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'name', constraints: [2] },
          }),
        );
      }
      if (normalizedName.length > 200) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'name', constraints: [200] },
          }),
        );
      }

      const existing = await this.operatingSystemRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.operatingSystems.osAlreadyExists'),
        );
      }

      operatingSystem.name = normalizedName;
    }

    try {
      return await this.operatingSystemRepository.save(operatingSystem);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDA PAGINADA Y CON FILTROS ---
  async findAll(filterDto: FilterOperatingSystemDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.operatingSystemRepository
      .createQueryBuilder('os')
      .take(limit)
      .skip(offset)
      .orderBy('os.name', 'ASC');

    if (query) {
      queryBuilder.where('LOWER(os.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [operatingSystems, total] = await queryBuilder.getManyAndCount();

    return {
      operatingSystems,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- BUSCAR UNO ---
  async findOne(id: string) {
    const operatingSystem = await this.operatingSystemRepository.findOneBy({
      id,
    });
    if (!operatingSystem) {
      throw new NotFoundException(
        this.i18n.t('errors.operatingSystems.osNotFound', { args: { id } }),
      );
    }
    return operatingSystem;
  }

  // --- ELIMINAR ---
  async remove(id: string) {
    const operatingSystem = await this.findOne(id);
    try {
      await this.operatingSystemRepository.remove(operatingSystem);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDER HELPERS ---
  async createSeedOperatingSystems(createDto: CreateOperatingsystemDto) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.operatingSystemRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  async deleteAllOperatingSystems() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.operatingSystemRepository
        .createQueryBuilder()
        .delete()
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- HELPERS ---
  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  private handleDBExceptions(error: unknown): never {
    const errorCode =
      error instanceof Object && 'code' in error
        ? String((error as Record<string, unknown>).code)
        : null;

    if (errorCode === '23505') {
      throw new ConflictException(
        this.i18n.t('errors.operatingSystems.osAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'operatingSystem' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
