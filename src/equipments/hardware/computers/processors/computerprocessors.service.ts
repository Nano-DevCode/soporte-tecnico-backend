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

import { CreateComputerprocessorDto } from './dto/create-computerprocessor.dto';
import { UpdateComputerprocessorDto } from './dto/update-computerprocessor.dto';
import { Computerprocessor } from './entities/computerprocessor.entity';
import { FilterComputerProcessorDto } from './dto/filter-computerprocessor.dto';

@Injectable()
export class ComputerprocessorsService {
  private readonly logger = new Logger(ComputerprocessorsService.name);

  constructor(
    @InjectRepository(Computerprocessor)
    private readonly computerProcessorRepository: Repository<Computerprocessor>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR PROCESADOR ---
  async create(createDto: CreateComputerprocessorDto) {
    const brand = this.cleanString(createDto.brand);
    const model = this.cleanString(createDto.model);
    const description = this.cleanString(createDto.description);

    if (brand.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'brand', constraints: [2] },
        }),
      );
    }
    if (brand.length > 200) {
      throw new BadRequestException(
        this.i18n.t('validation.maxLength', {
          args: { property: 'brand', constraints: [200] },
        }),
      );
    }

    if (model.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'model', constraints: [2] },
        }),
      );
    }
    if (model.length > 200) {
      throw new BadRequestException(
        this.i18n.t('validation.maxLength', {
          args: { property: 'model', constraints: [200] },
        }),
      );
    }

    if (description.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'description', constraints: [2] },
        }),
      );
    }
    if (description.length > 200) {
      throw new BadRequestException(
        this.i18n.t('validation.maxLength', {
          args: { property: 'description', constraints: [200] },
        }),
      );
    }

    const existing = await this.computerProcessorRepository.findOne({
      where: {
        brand: ILike(brand),
        model: ILike(model),
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.processors.processorAlreadyExists'),
      );
    }

    try {
      const processor = this.computerProcessorRepository.create({
        ...createDto,
        brand,
        model,
        description,
      });
      return await this.computerProcessorRepository.save(processor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR PROCESADOR ---
  async update(id: string, updateDto: UpdateComputerprocessorDto) {
    const { brand, model, description } = updateDto;

    const processor = await this.computerProcessorRepository.preload({ id });
    if (!processor) {
      throw new NotFoundException(
        this.i18n.t('errors.processors.processorNotFound', { args: { id } }),
      );
    }

    const hasBrand = brand && brand.trim().length > 0;
    const hasModel = model && model.trim().length > 0;
    const hasDescription = description && description.trim().length > 0;

    if (hasBrand || hasModel) {
      const brandToValidate = hasBrand
        ? this.cleanString(brand)
        : processor.brand;
      const modelToValidate = hasModel
        ? this.cleanString(model)
        : processor.model;

      if (brandToValidate.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'brand', constraints: [2] },
          }),
        );
      }
      if (brandToValidate.length > 200) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'brand', constraints: [200] },
          }),
        );
      }

      if (modelToValidate.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'model', constraints: [2] },
          }),
        );
      }
      if (modelToValidate.length > 200) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'model', constraints: [200] },
          }),
        );
      }

      const duplicate = await this.computerProcessorRepository.findOne({
        where: {
          brand: ILike(brandToValidate),
          model: ILike(modelToValidate),
          id: Not(id),
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('errors.processors.processorAlreadyExists'),
        );
      }

      processor.brand = brandToValidate;
      processor.model = modelToValidate;
    }

    if (hasDescription) {
      const cleanDesc = this.cleanString(description);
      if (cleanDesc.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'description', constraints: [2] },
          }),
        );
      }
      if (cleanDesc.length > 250) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'description', constraints: [250] },
          }),
        );
      }
      processor.description = cleanDesc;
    }

    try {
      return await this.computerProcessorRepository.save(processor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS CON FILTRO DE CONCATENACIÓN GLOBAL ---
  async findAll(filterDto: FilterComputerProcessorDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.computerProcessorRepository
      .createQueryBuilder('cp')
      .take(limit)
      .skip(offset)
      .orderBy('cp.brand', 'ASC')
      .addOrderBy('cp.model', 'ASC');

    if (query) {
      // Concatenamos los 3 campos en un único hilo de texto para emular un campo 'name'
      queryBuilder.where(
        "LOWER(CONCAT(cp.brand, ' ', cp.model, ' ', cp.description)) LIKE :query",
        { query: `%${query.toLowerCase()}%` },
      );
    }

    const [processors, total] = await queryBuilder.getManyAndCount();

    return {
      processors,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: string) {
    const processor = await this.computerProcessorRepository.findOneBy({ id });
    if (!processor) {
      throw new NotFoundException(
        this.i18n.t('errors.processors.processorNotFound', { args: { id } }),
      );
    }
    return processor;
  }

  // --- ELIMINAR PROCESADOR ---
  async remove(id: string) {
    const processor = await this.findOne(id);
    try {
      await this.computerProcessorRepository.remove(processor);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDERS ---
  async createSeedComputerProcessor(createDto: CreateComputerprocessorDto) {
    const brand = this.cleanString(createDto.brand);
    const model = this.cleanString(createDto.model);
    const existing = await this.computerProcessorRepository.findOneBy({
      brand: ILike(brand),
      model: ILike(model),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllComputerProcessor() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.computerProcessorRepository
        .createQueryBuilder()
        .delete()
        .execute();
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
        this.i18n.t('errors.processors.processorAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'computerProcessor' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
