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

import { Equipment } from './entities/equipment.entity';
import { Equipmenttype } from 'src/equipmenttypes/entities/equipmenttype.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { ComputersService } from 'src/computers/computers.service';
import { PrintersService } from 'src/printers/printers.service';
import { NetworksService } from 'src/networks/networks.service';
import { Responsibleequipment } from 'src/responsibleequipments/entities/responsibleequipment.entity';
import { Model } from 'src/models/entities/model.entity';
import { Department } from 'src/departments/entities/department.entity';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';

@Injectable()
export class EquipmentsService {
  private readonly logger = new Logger(EquipmentsService.name);

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
      return this.findOne(savedEquipment.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  // --- ACTUALIZAR EQUIPO ---
  // --- ACTUALIZAR EQUIPO ---
  async update(id: string, updateDto: UpdateEquipmentDto) {
    const equipmentExist = await this.findOne(id);

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

      // ... Sub-servicios (computersService, printersService, networksService)
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
      const updatedResult = await this.findOne(id);
      return this.mapToDto(
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

  // --- BUSCAR TODOS CON PAGINACIÓN ---
  async findAll(filterDto: FilterEquipmentDto) {
    const {
      query,
      status,
      category,
      id_departament,
      limit = 10,
      offset = 0,
    } = filterDto;

    const queryBuilder =
      this.equipmentRepository.createQueryBuilder('equipment');

    queryBuilder.leftJoinAndSelect('equipment.id_model', 'model');
    queryBuilder.leftJoinAndSelect('equipment.id_type_equipment', 'type');
    queryBuilder.leftJoinAndSelect('equipment.id_responsable', 'responsable');
    queryBuilder.leftJoinAndSelect('equipment.id_departament', 'departament');
    queryBuilder.leftJoinAndSelect('model.id_brand', 'brand');

    queryBuilder.leftJoinAndSelect('equipment.computer', 'computer');
    queryBuilder.leftJoinAndSelect('computer.id_processor', 'processor');
    queryBuilder.leftJoinAndSelect(
      'computer.id_type_operating_system',
      'operating_system',
    );
    queryBuilder.leftJoinAndSelect('equipment.printer', 'printer');
    queryBuilder.leftJoinAndSelect('printer.id_type_function', 'type_function');
    queryBuilder.leftJoinAndSelect('printer.id_type_printing', 'type_printing');
    queryBuilder.leftJoinAndSelect('equipment.network', 'network');
    queryBuilder.leftJoinAndSelect(
      'network.id_type_equipment_network',
      'type_network',
    );

    if (query && query.trim() !== '') {
      queryBuilder.andWhere(
        'equipment.num_inventario ILike :query OR equipment.num_serial ILike :query',
        {
          query: `%${query.trim()}%`,
        },
      );
    }

    if (status !== undefined && status !== null && status !== '') {
      const isTrue = String(status) === 'true';
      const isFalse = String(status) === 'false';

      if (isTrue || isFalse) {
        queryBuilder.andWhere('equipment.status = :status', {
          status: isTrue,
        });
      }
    }

    if (category && category !== 'all') {
      queryBuilder.andWhere('LOWER(type.name) = :category', {
        category: category.toLowerCase(),
      });
    }

    if (id_departament && id_departament.trim() !== '') {
      queryBuilder.andWhere('departament.id = :id_departament', {
        id_departament,
      });
    }
    queryBuilder.addSelect('equipment.created_at');
    queryBuilder.orderBy('equipment.created_at', 'DESC');

    queryBuilder.take(limit);
    queryBuilder.skip(offset);

    const [equipments, total] = await queryBuilder.getManyAndCount();

    return {
      data: equipments.map((eq) => this.mapToDto(eq, category || 'all')),
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- BUSCAR POR ID ---
  async findOne(id: string): Promise<Equipment> {
    this.validateUUID(id);
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
      relations: [
        'id_model',
        'id_type_equipment',
        'id_responsable',
        'id_departament',
        'id_model.id_brand',
        'computer',
        'computer.id_processor',
        'computer.id_type_operating_system',
        'computer.id_type_storage',
        'computer.id_type_equipment_computer',
        'printer',
        'printer.id_type_function',
        'printer.id_type_printing',
        'network',
        'network.id_type_equipment_network',
      ],
    });

    if (!equipment) {
      throw new NotFoundException(
        this.i18n.t('errors.equipments.equipmentNotFound', { args: { id } }),
      );
    }
    return equipment;
  }

  // --- BUSCAR POR TIPO CON PAGINACIÓN ---
  async findByType(
    typeId: number,
    category: string,
    filterDto: FilterEquipmentDto,
  ) {
    const { query, status, id_departament, limit = 10, offset = 0 } = filterDto;

    const queryBuilder =
      this.equipmentRepository.createQueryBuilder('equipment');

    queryBuilder.leftJoinAndSelect('equipment.id_model', 'model');
    queryBuilder.leftJoinAndSelect('equipment.id_type_equipment', 'type');
    queryBuilder.leftJoinAndSelect('equipment.id_responsable', 'responsable');
    queryBuilder.leftJoinAndSelect('equipment.id_departament', 'departament');
    queryBuilder.leftJoinAndSelect('model.id_brand', 'brand');
    queryBuilder.leftJoinAndSelect('equipment.computer', 'computer');
    queryBuilder.leftJoinAndSelect('equipment.printer', 'printer');
    queryBuilder.leftJoinAndSelect('equipment.network', 'network');
    queryBuilder.leftJoinAndSelect('computer.id_processor', 'processor');
    queryBuilder.leftJoinAndSelect(
      'computer.id_type_operating_system',
      'operating_system',
    );
    queryBuilder.leftJoinAndSelect('computer.id_type_storage', 'storage');
    queryBuilder.leftJoinAndSelect(
      'computer.id_type_equipment_computer',
      'type_computer',
    );
    queryBuilder.leftJoinAndSelect('printer.id_type_function', 'type_function');
    queryBuilder.leftJoinAndSelect('printer.id_type_printing', 'type_printing');
    queryBuilder.leftJoinAndSelect(
      'network.id_type_equipment_network',
      'type_network',
    );

    queryBuilder.where('equipment.id_type_equipment = :typeId', { typeId });

    if (query && query.trim() !== '') {
      queryBuilder.andWhere(
        'equipment.num_inventario ILike :query OR equipment.num_serial ILike :query',
        {
          query: `%${query.trim()}%`,
        },
      );
    }

    if (status !== undefined && status !== null) {
      queryBuilder.andWhere('equipment.status = :status', { status });
    }

    if (id_departament && id_departament.trim() !== '') {
      queryBuilder.andWhere('departament.id = :id_departament', {
        id_departament,
      });
    }

    // 🌟 CORRECCIÓN EXPLICITA PARA EL DISTINCT DE LA PAGINACIÓN
    queryBuilder.addSelect('equipment.created_at');
    queryBuilder.orderBy('equipment.created_at', 'DESC');

    queryBuilder.take(limit);
    queryBuilder.skip(offset);

    const [equipments, total] = await queryBuilder.getManyAndCount();

    return {
      data: equipments.map((eq) => this.mapToDto(eq, category)),
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- MAPEAR RESULTADOS A DTO ---
  private mapToDto(eq: Equipment, category: string) {
    const typeName = eq.id_type_equipment?.name.toLowerCase() || 'desconocido';
    const isSpecialType = !this.standardTypes.some((t) => typeName.includes(t));
    const targetCategory = category.toLowerCase();

    const base = {
      id: eq.id,
      folio: eq.num_inventario,
      num_serial: eq.num_serial || 'N/A',
      type: eq.id_type_equipment?.name || 'N/A',
      departamento: eq.id_departament?.name || 'Sin departamento',
      model: eq.id_model
        ? `${eq.id_model.id_brand?.name || 'Marca N/A'} - ${eq.id_model.name}`
        : 'Modelo no especificado',
      responsableName: eq.id_responsable
        ? `${eq.id_responsable.name} ${eq.id_responsable.first_name} ${eq.id_responsable.last_name}`
        : 'Sin asignar',
      status: eq.status,
      ...((isSpecialType || targetCategory !== 'all') && {
        description: eq.description || '',
      }),
    };

    if (
      eq.computer &&
      (targetCategory === 'all' ||
        targetCategory === 'computer' ||
        typeName.includes('computer') ||
        typeName.includes('computadora'))
    ) {
      return {
        ...base,
        processor: eq.computer.id_processor
          ? `${eq.computer.id_processor.brand || ''} - ${eq.computer.id_processor.model || ''}`
          : '-',
        ram: eq.computer?.ram || '-',
        storage: eq.computer?.capacity_storage || '-',
        operatingSystem: eq.computer.id_type_operating_system?.name || '-',
        typeEquipmentComputer:
          eq.computer.id_type_equipment_computer?.name ||
          'Accesorio de Computadora',
      };
    }

    if (
      eq.printer &&
      (targetCategory === 'all' ||
        targetCategory === 'printer' ||
        typeName.includes('printer') ||
        typeName.includes('impresora'))
    ) {
      return {
        ...base,
        typefunction: eq.printer.id_type_function?.name || 'N/A',
        typeprinting: eq.printer.id_type_printing?.name || 'N/A',
        color: eq.printer.color,
        modelToner: eq.printer.model_toner,
      };
    }

    if (
      eq.network &&
      (targetCategory === 'all' ||
        targetCategory === 'network' ||
        typeName.includes('network') ||
        typeName.includes('red'))
    ) {
      return {
        ...base,
        typeEquipmentNetwork:
          eq.network.id_type_equipment_network?.name || 'Accesorio de Red',
        numberPorts: eq.network.number_ports || 0,
        PoE: eq.network.PoE ?? false,
      };
    }

    return base;
  }

  // --- CAMBIAR ESTADOS (ACTIVACIÓN / DESACTIVACIÓN) ---
  async deactivate(id: string) {
    return this.changeStatus(id, false);
  }

  async activate(id: string) {
    return this.changeStatus(id, true);
  }

  private async changeStatus(id: string, status: boolean) {
    const equipment = await this.findOne(id);
    try {
      equipment.status = status;
      await this.equipmentRepository.save(equipment);
      return { id: equipment.id, status: equipment.status, updated: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- ELIMINAR EQUIPO ---
  async remove(id: string) {
    const equipment = await this.findOne(id);
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
    if (!num) return; // Si no hay número de serie sino no se hace la validacon
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

  // --- COMPROBAR FORMATO DE UUID ---
  private validateUUID(id: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(
        this.i18n.t('validation.isUuid', { args: { property: 'id' } }),
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
