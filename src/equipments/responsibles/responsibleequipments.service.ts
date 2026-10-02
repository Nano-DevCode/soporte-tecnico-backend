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

import { CreateResponsibleequipmentDto } from './dto/create-responsibleequipment.dto';
import { UpdateResponsibleequipmentDto } from './dto/update-responsibleequipment.dto';
import { Responsibleequipment } from './entities/responsibleequipment.entity';
import { FilterResponsibleEquipmentDto } from './dto/filter-responsibleequipment.dto';

@Injectable()
export class ResponsibleequipmentsService {
  private readonly logger = new Logger(ResponsibleequipmentsService.name);

  constructor(
    @InjectRepository(Responsibleequipment)
    private readonly responsibleRepository: Repository<Responsibleequipment>,
    private readonly i18n: I18nService,
  ) {}

  // --- CREAR RESPONSABLE ---
  async create(createDto: CreateResponsibleequipmentDto) {
    const normalizedData = {
      ...createDto,
      num_employe: createDto.num_employe.trim(),
      name: this.cleanString(createDto.name),
      first_name: this.cleanString(createDto.first_name),
      last_name: this.cleanString(createDto.last_name),
      area: this.cleanString(createDto.area),
      mail: createDto.mail.trim().toLowerCase(),
    };

    const existing = await this.responsibleRepository.findOne({
      where: [
        { num_employe: normalizedData.num_employe },
        { mail: ILike(normalizedData.mail) },
      ],
    });

    if (existing) {
      const isNumEmployee = existing.num_employe === normalizedData.num_employe;
      const translationKey = isNumEmployee
        ? 'errors.responsibles.employeeNumberAlreadyInUse'
        : 'errors.responsibles.emailAlreadyInUse';
      throw new ConflictException(this.i18n.t(translationKey));
    }

    try {
      const responsible = this.responsibleRepository.create(normalizedData);
      return await this.responsibleRepository.save(responsible);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ACTUALIZAR RESPONSABLE ---
  async update(id: string, updateDto: UpdateResponsibleequipmentDto) {
    const responsible = await this.responsibleRepository.preload({ id });
    if (!responsible) {
      throw new NotFoundException(
        this.i18n.t('errors.responsibles.responsibleNotFound', {
          args: { id },
        }),
      );
    }

    if (updateDto.num_employe)
      responsible.num_employe = updateDto.num_employe.trim();
    if (updateDto.name) responsible.name = this.cleanString(updateDto.name);
    if (updateDto.first_name)
      responsible.first_name = this.cleanString(updateDto.first_name);
    if (updateDto.last_name)
      responsible.last_name = this.cleanString(updateDto.last_name);
    if (updateDto.area) responsible.area = this.cleanString(updateDto.area);
    if (updateDto.mail) responsible.mail = updateDto.mail.trim().toLowerCase();

    const conflictCheck = await this.responsibleRepository.findOne({
      where: [
        { num_employe: responsible.num_employe, id: Not(id) },
        { mail: ILike(responsible.mail), id: Not(id) },
      ],
    });

    if (conflictCheck) {
      const isNumEmployee =
        conflictCheck.num_employe === responsible.num_employe;
      const translationKey = isNumEmployee
        ? 'errors.responsibles.employeeNumberAlreadyInUse'
        : 'errors.responsibles.emailAlreadyInUse';

      throw new ConflictException(this.i18n.t(translationKey));
    }

    try {
      return await this.responsibleRepository.save(responsible);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- BÚSQUEDA PAGINADA CON FILTROS (CONCATENACIÓN GLOBAL) ---
  async findAll(filterDto: FilterResponsibleEquipmentDto) {
    const { limit = 10, offset = 0, query } = filterDto;

    const queryBuilder = this.responsibleRepository
      .createQueryBuilder('re')
      .take(limit)
      .skip(offset)
      .orderBy('re.name', 'ASC')
      .addOrderBy('re.first_name', 'ASC');

    if (query) {
      // Concatenamos name, first_name, last_name y area para emular un sólo criterio textual
      queryBuilder.where(
        "LOWER(CONCAT(re.name, ' ', re.first_name, ' ', re.last_name, ' ', re.area)) LIKE :query",
        { query: `%${query.toLowerCase()}%` },
      );
    }

    const [responsibleEquipments, total] = await queryBuilder.getManyAndCount();

    return {
      responsibleEquipments,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- OBTENER UNO POR ID ---
  async findOne(id: string) {
    const responsible = await this.responsibleRepository.findOneBy({ id });
    if (!responsible) {
      throw new NotFoundException(
        this.i18n.t('errors.responsibles.responsibleNotFound', {
          args: { id },
        }),
      );
    }
    return responsible;
  }

  // --- ELIMINAR RESPONSABLE ---
  async remove(id: string) {
    const responsible = await this.findOne(id);
    try {
      await this.responsibleRepository.remove(responsible);
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
    const errorCode =
      error instanceof Object && 'code' in error
        ? String((error as Record<string, unknown>).code)
        : null;

    const errorDetail =
      error instanceof Object && 'detail' in error
        ? String((error as Record<string, unknown>).detail)
        : '';

    if (errorCode === '23505') {
      if (errorDetail.includes('num_employe')) {
        throw new ConflictException(
          this.i18n.t('errors.responsibles.employeeNumberAlreadyInUse'),
        );
      }
      if (errorDetail.includes('mail')) {
        throw new ConflictException(
          this.i18n.t('errors.responsibles.emailAlreadyInUse'),
        );
      }
      throw new ConflictException(
        this.i18n.t('errors.responsibles.employeeNumberAlreadyInUse'),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'responsible' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
