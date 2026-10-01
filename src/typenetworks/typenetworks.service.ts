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

import { CreateTypenetworkDto } from './dto/create-typenetwork.dto';
import { UpdateTypenetworkDto } from './dto/update-typenetwork.dto';
import { Typenetwork } from './entities/typenetwork.entity';
import { FilterTypeNetworkDto } from './dto/filter-typenetwork.dto';

@Injectable()
export class TypenetworksService {
  private readonly logger = new Logger(TypenetworksService.name);

  constructor(
    @InjectRepository(Typenetwork)
    private readonly typeNetworkRepository: Repository<Typenetwork>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR ---
  async create(createTypenetworkDto: CreateTypenetworkDto) {
    const normalizedName = this.cleanString(createTypenetworkDto.name);

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

    const existing = await this.typeNetworkRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.typeNetworks.tnAlreadyExists', {
          args: { name: normalizedName },
        }),
      );
    }

    try {
      const typenetwork = this.typeNetworkRepository.create({
        ...createTypenetworkDto,
        name: normalizedName,
      });
      return await this.typeNetworkRepository.save(typenetwork);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateTypenetworkDto: UpdateTypenetworkDto) {
    const { name } = updateTypenetworkDto;

    const typenetwork = await this.typeNetworkRepository.preload({ id });

    if (!typenetwork) {
      throw new NotFoundException(
        this.i18n.t('errors.typeNetworks.tnNotFound', { args: { id } }),
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

      const existing = await this.typeNetworkRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.typeNetworks.tnAlreadyExistsDuplicate'),
        );
      }

      typenetwork.name = normalizedName;
    }

    try {
      return await this.typeNetworkRepository.save(typenetwork);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDA PAGINADA CON FILTROS ---
  async findAll(filterDto: FilterTypeNetworkDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.typeNetworkRepository
      .createQueryBuilder('tn')
      .take(limit)
      .skip(offset)
      .orderBy('tn.name', 'ASC');

    if (query) {
      queryBuilder.where('LOWER(tn.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [typeNetworks, total] = await queryBuilder.getManyAndCount();

    return {
      typeNetworks,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- BUSCAR UNO ---
  async findOne(id: string) {
    const typenetwork = await this.typeNetworkRepository.findOneBy({ id });
    if (!typenetwork) {
      throw new NotFoundException(
        this.i18n.t('errors.typeNetworks.tnNotFound', { args: { id } }),
      );
    }
    return typenetwork;
  }

  // --- ELIMINAR ---
  async remove(id: string) {
    const typenetwork = await this.findOne(id);
    try {
      await this.typeNetworkRepository.remove(typenetwork);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDER HELPERS ---
  async createSeedTypeNetworks(createDto: CreateTypenetworkDto) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.typeNetworkRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  async deleteAllTypeNetworks() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.typeNetworkRepository.createQueryBuilder().delete().execute();
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
        this.i18n.t('errors.typeNetworks.tnAlreadyExistsDuplicate'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'typeNetwork' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
