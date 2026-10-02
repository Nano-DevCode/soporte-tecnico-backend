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

import { CreateMovementAplicationDto } from './dto/create-movement_aplication.dto';
import { UpdateMovementAplicationDto } from './dto/update-movement_aplication.dto';
import { MovementAplication } from './entities/movement_aplication.entity';
import { FilterMovementAplicationDto } from './dto/filter-movement_aplication.dto';

@Injectable()
export class MovementAplicationsService {
  private readonly logger = new Logger(MovementAplicationsService.name);

  constructor(
    @InjectRepository(MovementAplication)
    private readonly aplicationRepository: Repository<MovementAplication>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR APLICACIÓN DE MOVIMIENTO ---
  async create(createDto: CreateMovementAplicationDto) {
    const normalizedName = this.cleanString(createDto.name);
    const normalizedAcronym = this.cleanString(createDto.acronym).toUpperCase();

    // 1. Validaciones de longitud mínima en lógica de negocio
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
    if (normalizedAcronym.length < 2) {
      throw new BadRequestException(
        this.i18n.t('validation.minLength', {
          args: { property: 'acronym', constraints: [2] },
        }),
      );
    }
    if (normalizedAcronym.length > 200) {
      throw new BadRequestException(
        this.i18n.t('validation.maxLength', {
          args: { property: 'acronym', constraints: [200] },
        }),
      );
    }

    // 2. Control de duplicados proactivo (Fail-Fast)
    const existingName = await this.aplicationRepository.findOne({
      where: { name: ILike(normalizedName) },
    });
    if (existingName) {
      throw new ConflictException(
        this.i18n.t('errors.movementAplications.alreadyExists'),
      );
    }

    const existingAcronym = await this.aplicationRepository.findOne({
      where: { acronym: ILike(normalizedAcronym) },
    });
    if (existingAcronym) {
      throw new ConflictException(
        this.i18n.t('errors.movementAplications.acronymAlreadyExists'),
      );
    }

    // 3. Inserción segura
    try {
      const movementAplication = this.aplicationRepository.create({
        name: normalizedName,
        acronym: normalizedAcronym,
      });
      return await this.aplicationRepository.save(movementAplication);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR APLICACIÓN DE MOVIMIENTO ---
  async update(id: number, updateDto: UpdateMovementAplicationDto) {
    const { name, acronym } = updateDto;

    const movementAplication = await this.aplicationRepository.preload({ id });
    if (!movementAplication) {
      throw new NotFoundException(
        this.i18n.t('errors.movementAplications.notFound', { args: { id } }),
      );
    }

    // Validar y actualizar Nombre si se proporciona
    if (name && name.trim().length > 0) {
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

      const existingName = await this.aplicationRepository.findOne({
        where: { name: ILike(normalizedName), id: Not(id) },
      });
      if (existingName) {
        throw new ConflictException(
          this.i18n.t('errors.movementAplications.alreadyExists'),
        );
      }
      movementAplication.name = normalizedName;
    }

    // Validar y actualizar Acrónimo si se proporciona
    if (acronym && acronym.trim().length > 0) {
      const normalizedAcronym = this.cleanString(acronym).toUpperCase();
      if (normalizedAcronym.length < 2) {
        throw new BadRequestException(
          this.i18n.t('validation.minLength', {
            args: { property: 'acronym', constraints: [2] },
          }),
        );
      }
      if (normalizedAcronym.length > 200) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'acronym', constraints: [200] },
          }),
        );
      }

      const existingAcronym = await this.aplicationRepository.findOne({
        where: { acronym: ILike(normalizedAcronym), id: Not(id) },
      });
      if (existingAcronym) {
        throw new ConflictException(
          this.i18n.t('errors.movementAplications.acronymAlreadyExists'),
        );
      }
      movementAplication.acronym = normalizedAcronym;
    }

    try {
      return await this.aplicationRepository.save(movementAplication);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODAS (CON PAGINACIÓN Y BÚSQUEDA) ---
  async findAll(filterDto: FilterMovementAplicationDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.aplicationRepository
      .createQueryBuilder('movementAplication')
      .select([
        'movementAplication.id',
        'movementAplication.name',
        'movementAplication.acronym',
      ])
      .take(limit)
      .skip(offset)
      .orderBy('movementAplication.created_at', 'DESC');

    if (query) {
      queryBuilder.andWhere(
        'LOWER(movementAplication.name) LIKE :query OR LOWER(movementAplication.acronym) LIKE :query',
        { query: `%${query.toLowerCase()}%` },
      );
    }

    const [aplications, total] = await queryBuilder.getManyAndCount();

    return {
      aplications,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNA APLICACIÓN POR ID ---
  async findOne(id: number) {
    const movementAplication = await this.aplicationRepository.findOneBy({
      id,
    });
    if (!movementAplication) {
      throw new NotFoundException(
        this.i18n.t('errors.movementAplications.notFound', { args: { id } }),
      );
    }
    return movementAplication;
  }

  // --- ELIMINAR APLICACIÓN DE MOVIMIENTO ---
  async remove(id: number) {
    const movementAplication = await this.findOne(id);
    try {
      await this.aplicationRepository.remove(movementAplication);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEED SEGURO ---
  async createSeedMovementAplications(createDto: CreateMovementAplicationDto) {
    const normalizedName = this.cleanString(createDto.name);
    const movementAplication = await this.aplicationRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (movementAplication) return movementAplication;
    return this.create(createDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllMovementAplications() {
    try {
      await this.aplicationRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  // --- MANEJADOR DE EXCEPCIONES ESTÁNDAR ---
  private handleDBExceptions(error: unknown): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String((error as Record<string, unknown>).code);

      // 23503 = Foreign Key Violation (ej. Intentar borrar un registro en uso)
      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('validation.isMatches', {
            args: { property: 'movement_aplication' },
          }),
        );
      }
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
