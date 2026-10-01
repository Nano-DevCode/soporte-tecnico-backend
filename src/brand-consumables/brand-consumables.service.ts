import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { BrandConsumable } from './entities/brand-consumable.entity';
import { CreateBrandConsumableDto } from './dto/create-brand-consumable.dto';
import { UpdateBrandConsumableDto } from './dto/update-brand-consumable.dto';
import { FilterBrandconsumablesDto } from './dto/filter-brand-consumable.dto';

@Injectable()
export class BrandConsumablesService {
  private readonly logger = new Logger(BrandConsumablesService.name);

  constructor(
    @InjectRepository(BrandConsumable)
    private readonly brandRepository: Repository<BrandConsumable>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR MARCA ---
  async create(createBrandDTO: CreateBrandConsumableDto) {
    const normalizedName = this.cleanString(createBrandDTO.name);

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

    const existing = await this.brandRepository.findOne({
      where: { name: ILike(normalizedName) },
    });
    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.brands_consumable.brandAlreadyExists'),
      );
    }

    try {
      const brand = this.brandRepository.create({
        ...createBrandDTO,
        name: normalizedName,
      });
      return await this.brandRepository.save(brand);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR MARCA ---
  async update(id: string, updateBrandDTO: UpdateBrandConsumableDto) {
    const { name } = updateBrandDTO;

    const brand = await this.brandRepository.preload({ id });
    if (!brand) {
      throw new NotFoundException(
        this.i18n.t('errors.brands_consumable.brandNotFound', { args: { id } }),
      );
    }

    if (name && name.trim().length > 0) {
      const normalizedName = this.cleanString(name);

      if (normalizedName.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'name', constraints: [2] },
          }),
        );
      }

      const existing = await this.brandRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });
      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.brands_consumable.brandAlreadyExists'),
        );
      }

      brand.name = normalizedName;
    }

    try {
      return await this.brandRepository.save(brand);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODAS (CON PAGINACIÓN Y BÚSQUEDA) ---
  async findAll(filterDto: FilterBrandconsumablesDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.brandRepository
      .createQueryBuilder('brandConsumable')
      .select(['brandConsumable.id', 'brandConsumable.name'])
      .take(limit)
      .skip(offset)
      .orderBy('brandConsumable.created_at', 'DESC');

    if (query) {
      queryBuilder.andWhere('LOWER(brandConsumable.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [brands, total] = await queryBuilder.getManyAndCount();

    return {
      brands,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNA MARCA POR ID ---
  async findOne(id: string) {
    const brand = await this.brandRepository.findOneBy({ id });
    if (!brand) {
      throw new NotFoundException(
        this.i18n.t('errors.brands_consumable.brandNotFound', { args: { id } }),
      );
    }
    return brand;
  }

  async findOnebr(id: string) {
    return this.findOne(id);
  }

  // --- ELIMINAR MARCA ---
  async remove(id: string) {
    const brand = await this.findOne(id);
    try {
      await this.brandRepository.remove(brand);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEED SEGURO ---
  async createSeedBrands(createBrandDto: CreateBrandConsumableDto) {
    const normalizedName = this.cleanString(createBrandDto.name);
    const brand = await this.brandRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (brand) return brand;
    return this.create(createBrandDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllBrands() {
    try {
      await this.brandRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- AUXILIARES (Limpieza y Excepciones) ---
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
        this.i18n.t('errors.brands_consumable.brandAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'brand_consumable' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
