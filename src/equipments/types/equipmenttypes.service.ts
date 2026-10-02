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

import { CreateEquipmenttypeDto } from './dto/create-equipmenttype.dto';
import { UpdateEquipmenttypeDto } from './dto/update-equipmenttype.dto';
import { Equipmenttype } from './entities/equipmenttype.entity';
import { FilterEquipmenttypeDto } from './dto/filter-equipmenttype.dto';

@Injectable()
export class EquipmenttypesService {
  private readonly logger = new Logger(EquipmenttypesService.name);

  constructor(
    @InjectRepository(Equipmenttype)
    private readonly equipmentsTypeRepository: Repository<Equipmenttype>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR ---
  async create(createEquipmenttypeDto: CreateEquipmenttypeDto) {
    const normalizedName = this.cleanString(createEquipmenttypeDto.name);

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

    const existing = await this.equipmentsTypeRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.equipments.typeEquipmentNotFound'),
      );
    }

    try {
      const equipmentType = this.equipmentsTypeRepository.create({
        ...createEquipmenttypeDto,
        name: normalizedName,
      });
      return await this.equipmentsTypeRepository.save(equipmentType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR ---
  async update(id: number, updateEquipmenttypeDto: UpdateEquipmenttypeDto) {
    this.validateId(id);

    const { name } = updateEquipmenttypeDto;

    const equipmentType = await this.equipmentsTypeRepository.preload({ id });

    if (!equipmentType) {
      throw new NotFoundException(
        this.i18n.t('errors.equipments.equipmentNotFound', { args: { id } }),
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

      const existing = await this.equipmentsTypeRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.equipments.typeEquipmentNotFound'),
        );
      }

      equipmentType.name = normalizedName;
    }

    try {
      return await this.equipmentsTypeRepository.save(equipmentType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDAS CON FILTRO Y PAGINACIÓN ---
  async findAll(filterDto: FilterEquipmenttypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.equipmentsTypeRepository
      .createQueryBuilder('equipmentType')
      .select(['equipmentType.id', 'equipmentType.name'])
      .take(limit)
      .skip(offset)
      .orderBy('equipmentType.created_at', 'DESC');

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

  async findOne(id: number) {
    this.validateId(id);

    const equipmentType = await this.equipmentsTypeRepository.findOneBy({ id });
    if (!equipmentType) {
      throw new NotFoundException(
        this.i18n.t('errors.equipments.equipmentNotFound', { args: { id } }),
      );
    }
    return equipmentType;
  }

  async remove(id: number) {
    const equipmentType = await this.findOne(id);
    try {
      await this.equipmentsTypeRepository.remove(equipmentType);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDER HELPERS ---
  async createSeedEquipmentsTypes(createDto: CreateEquipmenttypeDto) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.equipmentsTypeRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  // async deleteAllEquipmentsTypes() {
  //   try {
  //     return await this.equipmentsTypeRepository.delete({});
  //   } catch (error) {
  //     this.handleDBExceptions(error);
  //   }
  // }
  async deleteAllEquipmentsTypes() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.equipmentsTypeRepository
        .createQueryBuilder()
        .delete()
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- HELPERS ---
  private validateId(id: unknown) {
    if (id === null || id === undefined || isNaN(Number(id))) {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', { args: { property: 'id' } }),
      );
    }
  }

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
        this.i18n.t('errors.equipments.typeEquipmentNotFound'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'equipmentType' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
