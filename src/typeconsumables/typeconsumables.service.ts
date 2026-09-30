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

import { Typeconsumable } from './entities/typeconsumable.entity';
import { CreateTypeconsumableDto } from './dto/create-typeconsumable.dto';
import { UpdateTypeconsumableDto } from './dto/update-typeconsumable.dto';
import { FilterTypeconsumableDto } from './dto/filter-typeconsumable.dto';

@Injectable()
export class TypeconsumablesService {
  private readonly logger = new Logger(TypeconsumablesService.name);

  constructor(
    @InjectRepository(Typeconsumable)
    private readonly typeConsumableRepository: Repository<Typeconsumable>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR TIPO ---
  public async create(
    createDto: CreateTypeconsumableDto,
  ): Promise<Typeconsumable> {
    const name = this.cleanString(createDto.name);

    // Validar duplicado por nombre (Insensible a mayúsculas)
    const existingName = await this.typeConsumableRepository.findOne({
      where: { name: ILike(name) },
    });
    if (existingName) {
      throw new ConflictException(
        this.i18n.t('errors.typeconsumables.alreadyExists', { args: { name } }),
      );
    }

    try {
      const typeConsumable = this.typeConsumableRepository.create({ name });
      return await this.typeConsumableRepository.save(typeConsumable);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS (CON FILTRO GLOBAL Y PAGINACIÓN) ---
  public async findAll(filterDto: FilterTypeconsumableDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.typeConsumableRepository
      .createQueryBuilder('tc')
      .take(limit)
      .skip(offset)
      .orderBy('tc.name', 'ASC');

    if (query) {
      // Filtrado inteligente por el campo name
      queryBuilder.where('LOWER(tc.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [types, total] = await queryBuilder.getManyAndCount();

    return {
      types,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  public async findOne(id: number): Promise<Typeconsumable> {
    const typeConsumable = await this.typeConsumableRepository.findOne({
      where: { id },
    });

    if (!typeConsumable) {
      throw new NotFoundException(
        this.i18n.t('errors.typeconsumables.notFound', { args: { id } }),
      );
    }
    return typeConsumable;
  }

  // --- MODIFICAR TIPO ---
  public async update(
    id: number,
    updateDto: UpdateTypeconsumableDto,
  ): Promise<Typeconsumable> {
    const typeConsumable = await this.findOne(id);

    if (updateDto.name) {
      const cleanedName = this.cleanString(updateDto.name);

      // Validar duplicado excluyendo el ID actual
      const duplicate = await this.typeConsumableRepository.findOne({
        where: { name: ILike(cleanedName), id: Not(id) },
      });
      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('errors.typeconsumables.alreadyExists', {
            args: { name: cleanedName },
          }),
        );
      }
      typeConsumable.name = cleanedName;
    }

    try {
      return await this.typeConsumableRepository.save(typeConsumable);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async createSeedTypesConsumables(
    createTypeConsumableDto: CreateTypeconsumableDto,
  ) {
    const normalizedName = this.cleanString(createTypeConsumableDto.name);
    const typeConsumable = await this.typeConsumableRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (typeConsumable) return typeConsumable;
    return this.create(createTypeConsumableDto);
  }

  // --- LIMPIAR TABLA ---
  async deleteAllTypesConsumables() {
    try {
      await this.typeConsumableRepository
        .createQueryBuilder()
        .delete()
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  // --- ELIMINAR TIPO ---
  public async remove(id: number) {
    const typeConsumable = await this.findOne(id);
    try {
      // Si tiene consumibles relacionados, fallará por la restricción RESTRICT de la entidad
      await this.typeConsumableRepository.remove(typeConsumable);
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
          this.i18n.t('errors.typeconsumables.alreadyExists', {
            args: { name: 'N/A' },
          }),
        );
      }

      // Código 23503: Violación de llave foránea (onDelete RESTRICT activo)
      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('validation.isMatches', {
            args: { property: 'typeconsumable' },
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
