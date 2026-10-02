import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Computer } from './entities/computer.entity';
import { CreateComputerDto } from './dto/create-computer.dto';
import { UpdateComputerDto } from './dto/update-computer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment } from '../../entities/equipment.entity';

@Injectable()
export class ComputersService {
  constructor(
    @InjectRepository(Computer) // Inyectar la entidad Network
    private readonly computerRepository: Repository<Computer>, // Se crea la propiedad de clase
  ) {}

  async createWithTransaction(
    manager: EntityManager,
    dto: CreateComputerDto,
    equipmentId: string,
  ) {
    const computer = manager.create(Computer, {
      id_equipment: { id: equipmentId } as Equipment,
      id_type_equipment_computer: { id: dto.id_type_equipment_computer },
      id_type_storage: { id: dto.id_type_storage },
      id_type_operating_system: { id: dto.id_type_operating_system },
      id_processor: { id: dto.id_processor },
      ram: dto.ram.trim().toUpperCase(),
      capacity_storage: dto.capacity_storage.trim().toUpperCase(),
      available_storage: dto.available_storage.trim().toUpperCase(),
    });

    return await manager.save(computer);
  }
  async updateWithTransaction(
    manager: EntityManager,
    computerId: string,
    updateDto: UpdateComputerDto,
  ) {
    // 1. Extraemos las relaciones para que no se mezclen con los campos simples del spread
    const {
      id_type_equipment_computer,
      id_processor,
      id_type_storage,
      id_type_operating_system,
      ram,
      capacity_storage,
      available_storage,
      // ...restOfDto
    } = updateDto;

    // 2. Preparamos el objeto de precarga
    const computer = await manager.preload(Computer, {
      id: computerId,
      // ...restOfDto, // Solo campos simples (ej. status, description si existieran aquí)

      // Normalización manual
      ...(ram && { ram: ram.trim().toUpperCase() }),
      ...(capacity_storage && {
        capacity_storage: capacity_storage.trim().toUpperCase(),
      }),
      ...(available_storage && {
        available_storage: available_storage.trim().toUpperCase(),
      }),

      // Mapeo de relaciones explícito (evita duplicidad de tipos string/object)
      ...(id_type_equipment_computer && {
        id_type_equipment_computer: { id: id_type_equipment_computer },
      }),
      ...(id_processor && {
        id_processor: { id: id_processor },
      }),
      ...(id_type_storage && {
        id_type_storage: { id: id_type_storage },
      }),
      ...(id_type_operating_system && {
        id_type_operating_system: { id: id_type_operating_system },
      }),
    });

    if (!computer) return; // O podrías lanzar un NotFoundException aquí

    return await manager.save(computer);
  }

  async findOneByEquipment(equipmentId: string, manager?: EntityManager) {
    // Si viene un manager (transacción), lo usamos. Si no, usamos el repositorio normal.
    const repo = manager
      ? manager.getRepository(Computer)
      : this.computerRepository;

    const computer = await repo.findOne({
      where: { id_equipment: { id: equipmentId } },
      relations: [
        'id_type_equipment_computer',
        'id_processor',
        'id_type_storage',
      ],
    });

    if (!computer)
      throw new NotFoundException(
        'Detalles técnicos de computadora no encontrados.',
      );
    return computer;
  }
}
