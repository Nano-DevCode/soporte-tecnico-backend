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

import { CreatePrinterfunctiontypeDto } from './dto/create-printerfunctiontype.dto';
import { UpdatePrinterfunctiontypeDto } from './dto/update-printerfunctiontype.dto';
import { Printerfunctiontype } from './entities/printerfunctiontype.entity';
import { FilterPrinterFunctionTypeDto } from './dto/filter-printerfunctiontype.dto';

@Injectable()
export class PrinterfunctiontypesService {
  private readonly logger = new Logger(PrinterfunctiontypesService.name);

  constructor(
    @InjectRepository(Printerfunctiontype)
    private readonly printerfunctiontypesRepository: Repository<Printerfunctiontype>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR ---
  async create(createPrinterfunctiontypeDto: CreatePrinterfunctiontypeDto) {
    const normalizedName = this.cleanString(createPrinterfunctiontypeDto.name);

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

    const existing = await this.printerfunctiontypesRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.printerFunctions.pfalreadyExists', {
          args: { name: normalizedName },
        }),
      );
    }

    try {
      const printerFunction = this.printerfunctiontypesRepository.create({
        ...createPrinterfunctiontypeDto,
        name: normalizedName,
      });
      return await this.printerfunctiontypesRepository.save(printerFunction);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR ---
  async update(
    id: string,
    updatePrinterfunctiontypeDto: UpdatePrinterfunctiontypeDto,
  ) {
    const { name } = updatePrinterfunctiontypeDto;

    const printerFunction = await this.printerfunctiontypesRepository.preload({
      id,
    });

    if (!printerFunction) {
      throw new NotFoundException(
        this.i18n.t('errors.printerFunctions.pfnotFound', { args: { id } }),
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

      const existing = await this.printerfunctiontypesRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.printerFunctions.pfalreadyExistsDuplicate'),
        );
      }

      printerFunction.name = normalizedName;
    }

    try {
      return await this.printerfunctiontypesRepository.save(printerFunction);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDA PAGINADA CON FILTROS ---
  async findAll(filterDto: FilterPrinterFunctionTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.printerfunctiontypesRepository
      .createQueryBuilder('pf')
      .take(limit)
      .skip(offset)
      .orderBy('pf.name', 'ASC');

    if (query) {
      queryBuilder.where('LOWER(pf.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [printerFunctions, total] = await queryBuilder.getManyAndCount();

    return {
      printerFunctions,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- BUSCAR UNO ---
  async findOne(id: string) {
    const printerFunction = await this.printerfunctiontypesRepository.findOneBy(
      { id },
    );
    if (!printerFunction) {
      throw new NotFoundException(
        this.i18n.t('errors.printerFunctions.pfnotFound', { args: { id } }),
      );
    }
    return printerFunction;
  }

  // --- ELIMINAR ---
  async remove(id: string) {
    const printerFunction = await this.findOne(id);
    try {
      await this.printerfunctiontypesRepository.remove(printerFunction);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- SEEDER HELPERS ---
  async createSeedPrinterfunctiontypes(
    createDto: CreatePrinterfunctiontypeDto,
  ) {
    const normalizedName = this.cleanString(createDto.name);
    const existing = await this.printerfunctiontypesRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createDto);
  }

  // async deleteAllPrinterfunctiontypes() {
  //   try {
  //     await this.printerfunctiontypesRepository.delete({});
  //   } catch (error) {
  //     this.handleDBExceptions(error);
  //   }
  // }
  async deleteAllPrinterfunctiontypes() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.printerfunctiontypesRepository
        .createQueryBuilder()
        .delete()
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- HELPERS ---
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
        this.i18n.t('errors.printerFunctions.pfalreadyExistsDuplicate'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'printerFunction' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
