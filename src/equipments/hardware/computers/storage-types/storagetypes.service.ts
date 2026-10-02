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

import { CreateStoragetypeDto } from './dto/create-storagetype.dto';
import { UpdateStoragetypeDto } from './dto/update-storagetype.dto';
import { Storagetype } from './entities/storagetype.entity';
import { FilterStorageTypeDto } from './dto/filter-storagetype.dto';

@Injectable()
export class StoragetypesService {
  private readonly logger = new Logger(StoragetypesService.name);

  constructor(
    @InjectRepository(Storagetype)
    private readonly storageTypeRepository: Repository<Storagetype>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR ---
  async create(createStoragetypeDto: CreateStoragetypeDto) {
    const normalizedName = this.cleanString(createStoragetypeDto.name);

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

    const existing = await this.storageTypeRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.storageTypes.storageAlreadyExists'),
      );
    }

    try {
      const storageType = this.storageTypeRepository.create({
        ...createStoragetypeDto,
        name: normalizedName,
      });
      return await this.storageTypeRepository.save(storageType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateStoragetypeDto: UpdateStoragetypeDto) {
    const { name } = updateStoragetypeDto;

    const storageType = await this.storageTypeRepository.preload({ id });

    if (!storageType) {
      throw new NotFoundException(
        this.i18n.t('errors.storageTypes.storageNotFound', { args: { id } }),
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

      const existing = await this.storageTypeRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.storageTypes.storageAlreadyExists'),
        );
      }

      storageType.name = normalizedName;
    }

    try {
      return await this.storageTypeRepository.save(storageType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDA PAGINADA CON FILTROS ---
  async findAll(filterDto: FilterStorageTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.storageTypeRepository
      .createQueryBuilder('st')
      .take(limit)
      .skip(offset)
      .orderBy('st.name', 'ASC');

    if (query) {
      queryBuilder.where('LOWER(st.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [storageTypes, total] = await queryBuilder.getManyAndCount();

    return {
      storageTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- BUSCAR UNO ---
  async findOne(id: string) {
    const storageType = await this.storageTypeRepository.findOneBy({ id });
    if (!storageType) {
      throw new NotFoundException(
        this.i18n.t('errors.storageTypes.storageNotFound', { args: { id } }),
      );
    }
    return storageType;
  }

  // --- ELIMINAR ---
  async remove(id: string) {
    const storageType = await this.findOne(id);
    try {
      await this.storageTypeRepository.remove(storageType);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDER HELPERS ---
  async createSeedStorageTypes(createDto: CreateStoragetypeDto) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.storageTypeRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }
  async deleteAllStorageTypes() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.storageTypeRepository.createQueryBuilder().delete().execute();
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
        this.i18n.t('errors.storageTypes.storageAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'storageType' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
