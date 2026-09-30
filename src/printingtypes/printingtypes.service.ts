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

import { CreatePrintingtypeDto } from './dto/create-printingtype.dto';
import { UpdatePrintingtypeDto } from './dto/update-printingtype.dto';
import { Printingtype } from './entities/printingtype.entity';
import { FilterPrintingTypeDto } from './dto/filter-printingtype.dto';

@Injectable()
export class PrintingtypesService {
  private readonly logger = new Logger(PrintingtypesService.name);

  constructor(
    @InjectRepository(Printingtype)
    private readonly printingtypeRepository: Repository<Printingtype>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR TIPO DE IMPRESIÓN ---
  async create(createPrintingtypeDto: CreatePrintingtypeDto) {
    const normalizedName = this.cleanString(createPrintingtypeDto.name);

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

    const existing = await this.printingtypeRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.printingTypes.ptAlreadyExists', {
          args: { name: normalizedName },
        }),
      );
    }

    try {
      const printingtype = this.printingtypeRepository.create({
        ...createPrintingtypeDto,
        name: normalizedName,
      });
      return await this.printingtypeRepository.save(printingtype);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR TIPO DE IMPRESIÓN ---
  async update(id: string, updatePrintingtypeDto: UpdatePrintingtypeDto) {
    const { name } = updatePrintingtypeDto;

    const printingtype = await this.printingtypeRepository.preload({ id });
    if (!printingtype) {
      throw new NotFoundException(
        this.i18n.t('errors.printingTypes.ptNotFound', { args: { id } }),
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

      const existing = await this.printingtypeRepository.findOne({
        where: {
          name: ILike(normalizedName),
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('errors.printingTypes.ptAlreadyExistsDuplicate'),
        );
      }
      printingtype.name = normalizedName;
    }

    try {
      return await this.printingtypeRepository.save(printingtype);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MÉTODOS DE CONSULTA PAGINADA ---
  async findAll(filterDto: FilterPrintingTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.printingtypeRepository
      .createQueryBuilder('pt')
      .take(limit)
      .skip(offset)
      .orderBy('pt.name', 'ASC');

    if (query) {
      queryBuilder.where('LOWER(pt.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [printingTypes, total] = await queryBuilder.getManyAndCount();

    return {
      printingTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const printingtype = await this.printingtypeRepository.findOneBy({ id });
    if (!printingtype) {
      throw new NotFoundException(
        this.i18n.t('errors.printingTypes.ptNotFound', { args: { id } }),
      );
    }
    return printingtype;
  }

  async remove(id: string) {
    const printingtype = await this.findOne(id);
    try {
      await this.printingtypeRepository.remove(printingtype);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async createSeedPrintintypes(createPrintingtypeDto: CreatePrintingtypeDto) {
    const normalizedName = this.cleanString(createPrintingtypeDto.name);
    const existing = await this.printingtypeRepository.findOneBy({
      name: ILike(normalizedName),
    });
    if (existing) return existing;
    return this.create(createPrintingtypeDto);
  }

  // async deleteAllPrintingtypes() {
  //   try {
  //     await this.printingtypeRepository.delete({});
  //   } catch (error) {
  //     this.handleDBExceptions(error);
  //   }
  // }

  // --- LIMPIAR TABLA ---
  async deleteAllPrintingtypes() {
    try {
      // QueryBuilder ignora la restricción de objeto vacío de TypeORM de forma segura
      await this.printingtypeRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

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
        this.i18n.t('errors.printingTypes.ptAlreadyExistsDuplicate'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'printingType' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
