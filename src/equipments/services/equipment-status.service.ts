import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Equipment } from '../entities/equipment.entity';
import { EquipmentQueriesService } from './equipment-queries.service';

@Injectable()
export class EquipmentStatusService {
  private readonly logger = new Logger(EquipmentStatusService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    private readonly queriesService: EquipmentQueriesService,
    private readonly i18n: I18nService,
  ) {}

  // --- CAMBIAR ESTADOS (ACTIVACIÓN / DESACTIVACIÓN) ---
  async deactivate(id: string) {
    return this.changeStatus(id, false);
  }

  async activate(id: string) {
    return this.changeStatus(id, true);
  }

  private async changeStatus(id: string, status: boolean) {
    const equipment = await this.queriesService.findOne(id);
    try {
      equipment.status = status;
      await this.equipmentRepository.save(equipment);
      return { id: equipment.id, status: equipment.status, updated: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
    const errorCode =
      error instanceof Object && 'code' in error
        ? String((error as Record<string, unknown>).code)
        : null;

    if (errorCode === '23505') {
      const detail = (error as { detail?: string }).detail || '';
      const match = detail.match(/\((.*?)\)=\((.*?)\)/);
      const duplicateValue = match ? match[2] : 'especificado';

      throw new ConflictException(
        this.i18n.t('errors.equipments.inventoryNumberAlreadyExists', {
          args: { num: duplicateValue },
        }),
      );
    }

    if (errorCode === '23503') {
      throw new BadRequestException(
        this.i18n.t('validation.isMatches', {
          args: { property: 'relations' },
        }),
      );
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
