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

import { CreateConsumableUbicationDto } from './dto/create-consumable_ubication.dto';
import { UpdateConsumableUbicationDto } from './dto/update-consumable_ubication.dto';
import { FilterConsumableubicationDto } from './dto/filter-consumable_ubication.dto';
import { ConsumableUbication } from './entities/consumable_ubication.entity';

@Injectable()
export class ConsumableUbicationsService {
  private readonly logger = new Logger(ConsumableUbicationsService.name);

  constructor(
    @InjectRepository(ConsumableUbication)
    private readonly ubicationRepository: Repository<ConsumableUbication>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR UBICACIÓN ---
  async create(createDto: CreateConsumableUbicationDto) {
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

    const existing = await this.ubicationRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('consumableUbications.ubicationAlreadyExists'),
      );
    }

    try {
      const ubication = this.ubicationRepository.create({
        ...createDto,
        name: normalizedName,
      });
      return await this.ubicationRepository.save(ubication);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR UBICACIÓN ---
  async update(id: string, updateDto: UpdateConsumableUbicationDto) {
    const { name } = updateDto;

    const ubication = await this.ubicationRepository.preload({ id });

    if (!ubication) {
      throw new NotFoundException(
        this.i18n.t('consumableUbications.ubicationNotFound', {
          args: { id },
        }),
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
      if (normalizedName.length > 200) {
        throw new BadRequestException(
          this.i18n.t('validation.maxLength', {
            args: { property: 'name', constraints: [200] },
          }),
        );
      }

      const existing = await this.ubicationRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('consumableUbications.ubicationAlreadyExists'),
        );
      }

      ubication.name = normalizedName;
    }

    try {
      return await this.ubicationRepository.save(ubication);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS (CON PAGINACIÓN Y BÚSQUEDA) ---
  async findAll(filterDto: FilterConsumableubicationDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.ubicationRepository
      .createQueryBuilder('ubication')
      .select(['ubication.id', 'ubication.name', 'ubication.created_at'])
      .take(limit)
      .skip(offset)
      .orderBy('ubication.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(ubication.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [ubications, total] = await queryBuilder.getManyAndCount();

    return {
      ubications,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: string) {
    const ubication = await this.ubicationRepository.findOneBy({ id });
    if (!ubication) {
      throw new NotFoundException(
        this.i18n.t('consumableUbications.ubicationNotFound', {
          args: { id },
        }),
      );
    }
    return ubication;
  }

  // --- ELIMINAR UBICACIÓN ---
  async remove(id: string) {
    const ubication = await this.findOne(id);
    try {
      await this.ubicationRepository.remove(ubication);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDERS ---
  async createSeedConsumableUbications(
    createDto: CreateConsumableUbicationDto,
  ) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.ubicationRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  async deleteAllConsumableUbications() {
    try {
      await this.ubicationRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LIMPIEZA DE CADENAS ---
  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  // --- MANEJO INTERNACIONALIZADO DE EXCEPCIONES DB ---
  private handleDBExceptions(error: any): never {
    const errorCode =
      error instanceof Object && 'code' in error
        ? String((error as Record<string, any>).code)
        : null;

    if (errorCode === '23505') {
      throw new ConflictException(
        this.i18n.t('consumableUbications.ubicationAlreadyExists'),
      );
    }

    // Código 23503 representa violación de llave foránea (onDelete: 'RESTRICT')
    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('consumableUbications.foreignKeyViolation'),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
