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
import { CreateMovementTypeDto } from './dto/create-movement_type.dto';
import { UpdateMovementTypeDto } from './dto/update-movement_type.dto';
import { MovementType } from './entities/movement_type.entity';
import { FilterMovementTypeDto } from './dto/filter-movement_type.dto';

@Injectable()
export class MovementTypesService {
  private readonly logger = new Logger(MovementTypesService.name);

  constructor(
    @InjectRepository(MovementType)
    private readonly movementTypeRepository: Repository<MovementType>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR TIPO DE MOVIMIENTO ---
  async create(createDto: CreateMovementTypeDto) {
    const normalizedName = this.cleanString(createDto.name);

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

    const existing = await this.movementTypeRepository.findOne({
      where: { name: ILike(normalizedName) },
    });
    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.movementTypes.alreadyExists'),
      );
    }

    try {
      const movementType = this.movementTypeRepository.create({
        ...createDto,
        name: normalizedName,
      });
      return await this.movementTypeRepository.save(movementType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR TIPO DE MOVIMIENTO ---
  async update(id: number, updateDto: UpdateMovementTypeDto) {
    const { name } = updateDto;

    const movementType = await this.movementTypeRepository.preload({ id });
    if (!movementType) {
      throw new NotFoundException(
        this.i18n.t('errors.movementTypes.notFound', { args: { id } }),
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

      const existing = await this.movementTypeRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });
      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.movementTypes.alreadyExists'),
        );
      }

      movementType.name = normalizedName;
    }

    try {
      return await this.movementTypeRepository.save(movementType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS (CON PAGINACIÓN Y BÚSQUEDA) ---
  async findAll(filterDto: FilterMovementTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.movementTypeRepository
      .createQueryBuilder('movementType')
      .select(['movementType.id', 'movementType.name'])
      .take(limit)
      .skip(offset)
      .orderBy('movementType.created_at', 'DESC');

    if (query) {
      queryBuilder.andWhere('LOWER(movementType.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [movementTypes, total] = await queryBuilder.getManyAndCount();

    return {
      movementTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: number) {
    const movementType = await this.movementTypeRepository.findOneBy({ id });
    if (!movementType) {
      throw new NotFoundException(
        this.i18n.t('errors.movementTypes.notFound', { args: { id } }),
      );
    }
    return movementType;
  }

  async findOnebr(id: number) {
    return this.findOne(id);
  }

  // --- ELIMINAR TIPO DE MOVIMIENTO ---
  async remove(id: number) {
    const movementType = await this.findOne(id);
    try {
      await this.movementTypeRepository.remove(movementType);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEED SEGURO ---
  async createSeedMovementTypes(createDto: CreateMovementTypeDto) {
    const normalizedName = this.cleanString(createDto.name);
    const movementType = await this.movementTypeRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (movementType) return movementType;
    return this.create(createDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllMovementTypes() {
    try {
      await this.movementTypeRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- AUXILIARES (Limpieza y Excepciones) ---
  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  private handleDBExceptions(error: any): never {
    const errorCode =
      error instanceof Object && 'code' in error
        ? String((error as Record<string, any>).code)
        : null;

    if (errorCode === '23505') {
      throw new ConflictException(
        this.i18n.t('errors.movementTypes.alreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'movement_type' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
