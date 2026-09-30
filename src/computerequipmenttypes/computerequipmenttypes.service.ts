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

import { CreateComputerequipmenttypeDto } from './dto/create-computerequipmenttype.dto';
import { UpdateComputerequipmenttypeDto } from './dto/update-computerequipmenttype.dto';
import { Computerequipmenttype } from './entities/computerequipmenttype.entity';
import { FilterComputerequipmenttypeDto } from './dto/filter-computerequipmenttype.dto';

@Injectable()
export class ComputerequipmenttypesService {
  private readonly logger = new Logger(ComputerequipmenttypesService.name);

  constructor(
    @InjectRepository(Computerequipmenttype)
    private readonly computerEquipmentTypeRepository: Repository<Computerequipmenttype>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR TIPO DE EQUIPO ---
  async create(createDto: CreateComputerequipmenttypeDto) {
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

    const existing = await this.computerEquipmentTypeRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.computerEquipmentTypes.typeAlreadyExists'),
      );
    }

    try {
      const equipmentType = this.computerEquipmentTypeRepository.create({
        ...createDto,
        name: normalizedName,
      });
      return await this.computerEquipmentTypeRepository.save(equipmentType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR TIPO DE EQUIPO ---
  async update(id: string, updateDto: UpdateComputerequipmenttypeDto) {
    const { name } = updateDto;

    const equipmentType = await this.computerEquipmentTypeRepository.preload({
      id,
    });

    if (!equipmentType) {
      throw new NotFoundException(
        this.i18n.t('errors.computerEquipmentTypes.typeNotFound', {
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

      const existing = await this.computerEquipmentTypeRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.computerEquipmentTypes.typeAlreadyExists'),
        );
      }

      equipmentType.name = normalizedName;
    }

    try {
      return await this.computerEquipmentTypeRepository.save(equipmentType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR TODOS (CON PAGINACIÓN Y BÚSQUEDA) ---
  async findAll(filterDto: FilterComputerequipmenttypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.computerEquipmentTypeRepository
      .createQueryBuilder('equipmentType')
      .select(['equipmentType.id', 'equipmentType.name'])
      .take(limit)
      .skip(offset)
      .orderBy('equipmentType.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(equipmentType.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [equipmentTypes, total] = await queryBuilder.getManyAndCount();

    return {
      equipmentTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: string) {
    const equipmentType = await this.computerEquipmentTypeRepository.findOneBy({
      id,
    });
    if (!equipmentType) {
      throw new NotFoundException(
        this.i18n.t('errors.computerEquipmentTypes.typeNotFound', {
          args: { id },
        }),
      );
    }
    return equipmentType;
  }

  // --- ELIMINAR TIPO DE EQUIPO ---
  async remove(id: string) {
    const equipmentType = await this.findOne(id);
    try {
      await this.computerEquipmentTypeRepository.remove(equipmentType);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDERS ---
  async createSeedComputerEquipmentTypes(
    createDto: CreateComputerequipmenttypeDto,
  ) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.computerEquipmentTypeRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  async deleteAllComputerEquipmentTypes() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.computerEquipmentTypeRepository
        .createQueryBuilder()
        .delete()
        .execute();
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
        this.i18n.t('errors.computerEquipmentTypes.typeAlreadyExists'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'computerEquipmentType' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
