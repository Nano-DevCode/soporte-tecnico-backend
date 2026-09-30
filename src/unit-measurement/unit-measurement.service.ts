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

import { UnitMeasurement } from './entities/unit-measurement.entity';
import { CreateUnitMeasurementDto } from './dto/create-unit-measurement.dto';
import { UpdateUnitMeasurementDto } from './dto/update-unit-measurement.dto';
import { FilterUnitmeasurementDto } from './dto/filter-unit-measurement.dto';

@Injectable()
export class UnitMeasurementService {
  private readonly logger = new Logger(UnitMeasurementService.name);

  constructor(
    @InjectRepository(UnitMeasurement)
    private readonly unitRepository: Repository<UnitMeasurement>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR UNIDAD DE MEDIDA ---
  public async create(
    createDto: CreateUnitMeasurementDto,
  ): Promise<UnitMeasurement> {
    const name = this.cleanString(createDto.name);

    // Validar duplicado por nombre (Insensible a mayúsculas)
    const existingName = await this.unitRepository.findOne({
      where: { name: ILike(name) },
    });
    if (existingName) {
      throw new ConflictException(
        this.i18n.t('errors.unitMeasurement.alreadyExists', { args: { name } }),
      );
    }

    try {
      const unitMeasurement = this.unitRepository.create({ name });
      return await this.unitRepository.save(unitMeasurement);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODAS (CON FILTRO GLOBAL EN NAME Y PAGINACIÓN) ---
  public async findAll(filterDto: FilterUnitmeasurementDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.unitRepository
      .createQueryBuilder('um')
      .take(limit)
      .skip(offset)
      .orderBy('um.name', 'ASC');

    if (query) {
      // El query aplica directamente sobre el campo name transformado a minúsculas
      queryBuilder.where('LOWER(um.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [units, total] = await queryBuilder.getManyAndCount();

    return {
      units,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNA POR ID ---
  public async findOne(id: number): Promise<UnitMeasurement> {
    const unitMeasurement = await this.unitRepository.findOne({
      where: { id },
    });

    if (!unitMeasurement) {
      throw new NotFoundException(
        this.i18n.t('errors.unitMeasurement.notFound', { args: { id } }),
      );
    }
    return unitMeasurement;
  }

  // --- MODIFICAR UNIDAD DE MEDIDA ---
  public async update(
    id: number,
    updateDto: UpdateUnitMeasurementDto,
  ): Promise<UnitMeasurement> {
    const unitMeasurement = await this.findOne(id);

    if (updateDto.name) {
      const cleanedName = this.cleanString(updateDto.name);

      // Validar duplicado excluyendo el ID actual para evitar conflictos consigo mismo
      const duplicate = await this.unitRepository.findOne({
        where: { name: ILike(cleanedName), id: Not(id) },
      });
      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('errors.unitMeasurement.alreadyExists', {
            args: { name: cleanedName },
          }),
        );
      }
      unitMeasurement.name = cleanedName;
    }

    try {
      return await this.unitRepository.save(unitMeasurement);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  async createSeedUnitMeasurements(
    createUnitMeasurementDto: CreateUnitMeasurementDto,
  ) {
    const normalizedName = this.cleanString(createUnitMeasurementDto.name);
    const unitMeasurement = await this.unitRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (unitMeasurement) return unitMeasurement;
    return this.create(createUnitMeasurementDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllUnitMeasurements() {
    try {
      await this.unitRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ELIMINAR UNIDAD DE MEDIDA ---
  public async remove(id: number) {
    const unitMeasurement = await this.findOne(id);
    try {
      // Si está asignado a un consumible, fallará por la restricción RESTRICT de la entidad
      await this.unitRepository.remove(unitMeasurement);
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
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String((error as Record<string, unknown>).code);

      // Código 23505: Violación de llave única
      if (errorCode === '23505') {
        throw new ConflictException(
          this.i18n.t('errors.unitMeasurement.alreadyExists', {
            args: { name: 'N/A' },
          }),
        );
      }
      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('validation.isMatches', {
            args: { property: 'unit_measurement' },
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
