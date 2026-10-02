import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment } from '../../entities/equipment.entity';

@Injectable()
export class PrintersService {
  constructor(
    @InjectRepository(Printer) // Inyectar la entidad Printer
    private readonly printerRepository: Repository<Printer>, // Se crea la propiedad de clase
  ) {}

  async createWithTransaction(
    manager: EntityManager,
    dto: CreatePrinterDto,
    equipmentId: string,
  ) {
    const printer = manager.create(Printer, {
      id_equipment: { id: equipmentId } as Equipment,
      id_type_printing: { id: dto.id_type_printing },
      id_type_function: { id: dto.id_type_function },
      color: dto.color ?? false,
      model_toner: dto.model_toner.trim().toUpperCase(),
    });
    return await manager.save(printer);
  }
  async updateWithTransaction(
    manager: EntityManager,
    printerId: string,
    dto: UpdatePrinterDto,
  ) {
    const {
      id_type_printing,
      id_type_function,
      model_toner,
      color,
      ...restOfDto
    } = dto;

    const printer = await manager.preload(Printer, {
      id: printerId,
      ...restOfDto, // Campos simples adicionales si los hubiera

      ...(model_toner && {
        model_toner: model_toner.trim().toUpperCase(),
      }),

      ...(color !== undefined && { color }),

      ...(id_type_printing && {
        id_type_printing: { id: id_type_printing },
      }),
      ...(id_type_function && {
        id_type_function: { id: id_type_function },
      }),
    });

    if (!printer) return;

    return await manager.save(printer);
  }

  async findOneByEquipment(equipmentId: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Printer)
      : this.printerRepository;

    const printer = await repo.findOne({
      where: { id_equipment: { id: equipmentId } },
      relations: ['id_type_printing', 'id_type_function'],
    });

    if (!printer)
      throw new NotFoundException('Detalles de impresión no encontrados.');
    return printer;
  }
}
