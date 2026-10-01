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

import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Model } from './entities/model.entity';
import { Brand } from '../brands/entities/brand.entity';
import { FilterModelDto } from './dto/filter-model.dto';

@Injectable()
export class ModelsService {
  private readonly logger = new Logger('ModelsService');

  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,

    private readonly i18n: I18nService,
  ) {}

  // --- CREAR MODELO ---
  async create(createModelDto: CreateModelDto) {
    const { id_brand, name } = createModelDto;
    const normalizedName = this.cleanString(name);

    if (normalizedName.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'name', constraints: [2] },
        }),
      );
    }

    const brand = await this.brandRepository.findOneBy({ id: id_brand });
    if (!brand) {
      throw new NotFoundException(
        this.i18n.t('errors.brands.brandNotFound', { args: { id: id_brand } }),
      );
    }

    const existing = await this.modelRepository.findOne({
      where: {
        name: ILike(normalizedName),
        id_brand: { id: id_brand },
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.models.modelAlreadyExists'),
      );
    }

    try {
      const modelo = this.modelRepository.create({
        name: normalizedName,
        id_brand: brand,
      });
      return await this.modelRepository.save(modelo);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR MODELO ---
  async update(id: string, updateModelDto: UpdateModelDto) {
    const { id_brand, name } = updateModelDto;

    const modelo = await this.modelRepository.preload({ id });
    if (!modelo) {
      throw new NotFoundException(
        this.i18n.t('errors.models.modelNotFound', { args: { id } }),
      );
    }

    const hasName = name && name.trim().length > 0;
    const hasBrand = id_brand && id_brand.trim().length > 0;

    if (hasName || hasBrand) {
      const nameToValidate = hasName ? this.cleanString(name) : modelo.name;

      const currentBrandId =
        modelo.id_brand instanceof Brand ? modelo.id_brand.id : modelo.id_brand;
      const brandIdToValidate: string = hasBrand
        ? id_brand
        : typeof currentBrandId === 'string'
          ? currentBrandId
          : (currentBrandId as Brand)?.id;

      if (hasName && nameToValidate.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'name', constraints: [2] },
          }),
        );
      }

      const duplicate = await this.modelRepository.findOne({
        where: {
          name: ILike(nameToValidate),
          id_brand: { id: brandIdToValidate },
          id: Not(id),
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('errors.models.modelAlreadyExists'),
        );
      }

      if (hasName) modelo.name = nameToValidate;

      if (hasBrand) {
        const brand = await this.brandRepository.findOneBy({ id: id_brand });
        if (!brand) {
          throw new NotFoundException(
            this.i18n.t('errors.brands.brandNotFound', {
              args: { id: id_brand },
            }),
          );
        }
        modelo.id_brand = brand;
      }
    }

    try {
      return await this.modelRepository.save(modelo);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS (CON PAGINACIÓN, RELACIONES Y FILTROS) ---
  async findAll(filterDto: FilterModelDto) {
    const { limit = 10, offset = 0, query, brandId } = filterDto;

    const queryBuilder = this.modelRepository
      .createQueryBuilder('model')
      .leftJoin('model.id_brand', 'brand')
      .select(['model.id', 'model.name', 'brand.id', 'brand.name'])
      .take(limit)
      .skip(offset)
      .orderBy('model.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(model.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    const [models, total] = await queryBuilder.getManyAndCount();

    return {
      models,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: string) {
    const model = await this.modelRepository.findOne({
      where: { id },
      relations: ['id_brand'],
    });
    if (!model) {
      throw new NotFoundException(
        this.i18n.t('errors.models.modelNotFound', { args: { id } }),
      );
    }
    return model;
  }

  async findOneBr(id: string) {
    const model = await this.modelRepository.findOne({
      where: { id },
      relations: { id_brand: true },
      select: {
        id: true,
        name: true,
        id_brand: {
          id: true,
          name: true,
        },
      },
    });

    if (!model) {
      throw new NotFoundException(
        this.i18n.t('errors.models.modelNotFound', { args: { id } }),
      );
    }
    return model;
  }

  async findByBrand(brandId: string, filterDto: FilterModelDto = {}) {
    // Sobrescribimos o inyectamos de manera segura el brandId al DTO de paginación
    return await this.findAll({
      ...filterDto,
      brandId,
    });
  }

  // --- ELIMINAR MODELO ---
  async remove(id: string) {
    const modelo = await this.findOne(id);
    try {
      await this.modelRepository.remove(modelo);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- AUXILIARES ---
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
        this.i18n.t('errors.models.modelAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', { args: { property: 'model' } }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
