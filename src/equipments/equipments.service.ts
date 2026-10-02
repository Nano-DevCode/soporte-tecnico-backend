import { Injectable } from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { Equipment } from './entities/equipment.entity';
import { EquipmentCrudService } from './services/equipment-crud.service';
import { EquipmentQueriesService } from './services/equipment-queries.service';
import { EquipmentStatusService } from './services/equipment-status.service';

@Injectable()
export class EquipmentsService {
  constructor(
    private readonly crudService: EquipmentCrudService,
    private readonly queriesService: EquipmentQueriesService,
    private readonly statusService: EquipmentStatusService,
  ) {}

  create(createDto: CreateEquipmentDto) {
    return this.crudService.create(createDto);
  }

  findAll(filterDto: FilterEquipmentDto) {
    return this.queriesService.findAll(filterDto);
  }

  findOne(id: string) {
    return this.queriesService.findOne(id);
  }

  findByType(typeId: number, category: string, filterDto: FilterEquipmentDto) {
    return this.queriesService.findByType(typeId, category, filterDto);
  }

  update(id: string, updateDto: UpdateEquipmentDto) {
    return this.crudService.update(id, updateDto);
  }

  deactivate(id: string) {
    return this.statusService.deactivate(id);
  }

  activate(id: string) {
    return this.statusService.activate(id);
  }

  remove(id: string) {
    return this.crudService.remove(id);
  }

  mapToDto(eq: Equipment, category: string) {
    return this.queriesService.mapToDto(eq, category);
  }
}
