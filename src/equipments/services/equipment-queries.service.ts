import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Equipment } from '../entities/equipment.entity';
import { FilterEquipmentDto } from '../dto/filter-equipment.dto';

@Injectable()
export class EquipmentQueriesService {
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
    private readonly i18n: I18nService,
  ) {}

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
  mapToDto(eq: Equipment, category: string) {
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

  // --- COMPROBAR FORMATO DE UUID ---
  validateUUID(id: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(
        this.i18n.t('validation.isUuid', { args: { property: 'id' } }),
      );
    }
  }
}
