import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, QueryRunner } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Equipment } from '../entities/equipment.entity';
import { Equipmenttype } from '../types/entities/equipmenttype.entity';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { ComputersService } from '../hardware/computers/computers.service';
import { PrintersService } from '../hardware/printers/printers.service';
import { NetworksService } from '../hardware/networks/networks.service';
import { Responsibleequipment } from '../responsibles/entities/responsibleequipment.entity';
import { Model } from '../models/entities/model.entity';
import { Department } from 'src/departments/entities/department.entity';
import { EquipmentQueriesService } from './equipment-queries.service';

@Injectable()
export class EquipmentCrudService {
  private readonly logger = new Logger(EquipmentCrudService.name);

  private readonly standardTypes = [
    'computadora',
    'computer',
    'impresora',
    'printer',
    'red',
    'network',
  ];

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    private readonly dataSource: DataSource,
    private readonly computersService: ComputersService,
    private readonly printersService: PrintersService,
    private readonly networksService: NetworksService,
    @InjectRepository(Equipmenttype)
    private readonly typeRepository: Repository<Equipmenttype>,
    private readonly queriesService: EquipmentQueriesService,
    private readonly i18n: I18nService,
  ) {}

  private async validateDescription(
    typeId: number,
    description: string,
  ): Promise<void> {
    const type = await this.typeRepository.findOneBy({ id: typeId });
    if (!type) {
      throw new NotFoundException(
        this.i18n.t('errors.equipments.typeEquipmentNotFound'),
      );
    }

    const typeName = type.name.toLowerCase();
    const isStandard = this.standardTypes.some((t) => typeName.includes(t));

    if (!isStandard && (!description || description.trim().length === 0)) {
      throw new BadRequestException(
        this.i18n.t('validation.isNotEmpty', {
          args: { property: 'description' },
        }),
      );
    }
  }

  private cleanString(str: string | undefined | null): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  // --- CREAR EQUIPO ---
  async create(createDto: CreateEquipmentDto) {
    await this.validateDescription(
      createDto.id_type_equipment,
      createDto.description,
    );

    const cleanInv = this.cleanString(createDto.num_inventario);
    await this.checkDuplicateInventory(cleanInv);

    // Limpieza del número de serie
    const cleanSerial = this.cleanString(createDto.num_serial);
    if (cleanSerial.length > 0) {
      await this.checkDuplicateSerial(cleanSerial);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const equipment = queryRunner.manager.create(Equipment, {
        num_inventario: cleanInv,
        status: createDto.status ?? true,
        description: createDto.description ? createDto.description.trim() : '',
        num_serial: cleanSerial.length > 0 ? cleanSerial : undefined,
      });

      equipment.id_model = { id: createDto.id_model } as Model;
      equipment.id_type_equipment = {
        id: createDto.id_type_equipment,
      } as Equipmenttype;

      if (createDto.id_departament) {
        equipment.id_departament = {
          id: createDto.id_departament,
        } as Department;
      }
      if (createDto.id_responsable) {
        equipment.id_responsable = {
          id: createDto.id_responsable,
        } as Responsibleequipment;
      }

      const savedEquipment = await queryRunner.manager.save(equipment);

      if (createDto.computer) {
        await this.computersService.createWithTransaction(
          queryRunner.manager,
          createDto.computer,
          savedEquipment.id,
        );
      } else if (createDto.printer) {
        await this.printersService.createWithTransaction(
          queryRunner.manager,
          createDto.printer,
          savedEquipment.id,
        );
      } else if (createDto.network) {
        await this.networksService.createWithTransaction(
          queryRunner.manager,
          createDto.network,
          savedEquipment.id,
        );
      }

      await queryRunner.commitTransaction();
      return this.queriesService.findOne(savedEquipment.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  // --- ACTUALIZAR EQUIPO ---
  async update(id: string, updateDto: UpdateEquipmentDto) {
    const equipmentExist = await this.queriesService.findOne(id);

    const typeIdToCheck =
      updateDto.id_type_equipment || equipmentExist.id_type_equipment.id;
    const descriptionToCheck =
      updateDto.description !== undefined
        ? updateDto.description
        : equipmentExist.description;

    await this.validateDescription(Number(typeIdToCheck), descriptionToCheck);

    if (updateDto.num_inventario) {
      const cleanInv = this.cleanString(updateDto.num_inventario);
      await this.checkDuplicateInventory(cleanInv, id);
      updateDto.num_inventario = cleanInv;
    }

    // Lógica para num_serial
    let parsedNumSerial: string | null | undefined = undefined;

    if (updateDto.num_serial !== undefined) {
      if (updateDto.num_serial === null) {
        parsedNumSerial = null;
      } else {
        const cleaned = this.cleanString(updateDto.num_serial);
        if (cleaned.length > 0) {
          await this.checkDuplicateSerial(cleaned, id);
          parsedNumSerial = cleaned;
        } else {
          parsedNumSerial = null; // Si viene "" o con puros espacios
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const equipment = await queryRunner.manager.preload(Equipment, {
        id: id,
        num_inventario: updateDto.num_inventario,
        num_serial: parsedNumSerial,
        description: updateDto.description,
        status: updateDto.status,
        id_model: updateDto.id_model ? { id: updateDto.id_model } : undefined,
        id_type_equipment: updateDto.id_type_equipment
          ? { id: updateDto.id_type_equipment }
          : undefined,
        id_departament: updateDto.id_departament
          ? { id: updateDto.id_departament }
          : undefined,
        id_responsable: updateDto.id_responsable
          ? { id: updateDto.id_responsable }
          : undefined,
      });

      if (!equipment) {
        throw new NotFoundException(
          this.i18n.t('errors.equipments.equipmentNotFound', { args: { id } }),
        );
      }

      const savedEquipment = await queryRunner.manager.save(equipment);

      // Sub-servicios (computersService, printersService, networksService)
      if (updateDto.computer) {
        if (equipmentExist.computer) {
          await this.computersService.updateWithTransaction(
            queryRunner.manager,
            equipmentExist.computer.id.toString(),
            updateDto.computer,
          );
        } else {
          await this.computersService.createWithTransaction(
            queryRunner.manager,
            updateDto.computer,
            savedEquipment.id,
          );
        }
      } else if (updateDto.printer) {
        if (equipmentExist.printer) {
          await this.printersService.updateWithTransaction(
            queryRunner.manager,
            equipmentExist.printer.id.toString(),
            updateDto.printer,
          );
        } else {
          await this.printersService.createWithTransaction(
            queryRunner.manager,
            updateDto.printer,
            savedEquipment.id,
          );
        }
      } else if (updateDto.network) {
        if (equipmentExist.network) {
          await this.networksService.updateWithTransaction(
            queryRunner.manager,
            equipmentExist.network.id.toString(),
            updateDto.network,
          );
        } else {
          await this.networksService.createWithTransaction(
            queryRunner.manager,
            updateDto.network,
            savedEquipment.id,
          );
        }
      }

      await queryRunner.commitTransaction();
      const updatedResult = await this.queriesService.findOne(id);
      return this.queriesService.mapToDto(
        updatedResult,
        updatedResult.id_type_equipment?.name.toLowerCase(),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  // --- ELIMINAR EQUIPO ---
  async remove(id: string) {
    const equipment = await this.queriesService.findOne(id);
    try {
      await this.equipmentRepository.remove(equipment);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- COMPROBAR INVENTARIO DUPLICADO ---
  private async checkDuplicateInventory(
    num: string,
    excludeId?: string,
  ): Promise<void> {
    const criteria = excludeId
      ? { num_inventario: num, id: Not(excludeId) }
      : { num_inventario: num };
    const exists = await this.equipmentRepository.findOne({ where: criteria });
    if (exists) {
      throw new ConflictException(
        this.i18n.t('errors.equipments.inventoryNumberAlreadyExists', {
          args: { num },
        }),
      );
    }
  }

  private async checkDuplicateSerial(
    num: string | null,
    excludeId?: string,
  ): Promise<void> {
    if (!num) return;
    const criteria = excludeId
      ? { num_serial: num, id: Not(excludeId) }
      : { num_serial: num };
    const exists = await this.equipmentRepository.findOne({ where: criteria });
    if (exists) {
      throw new ConflictException(
        this.i18n.t('errors.equipments.serialNumberAlreadyExists', {
          args: { num },
        }),
      );
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
