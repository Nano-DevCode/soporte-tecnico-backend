import { Injectable } from '@nestjs/common';
import { CreateEquipmentticketDto } from './dto/create-equipmentticket.dto';
import { UpdateEquipmentticketDto } from './dto/update-equipmentticket.dto';

@Injectable()
export class EquipmentticketsService {
  create(createEquipmentticketDto: CreateEquipmentticketDto) {
    return 'This action adds a new equipmentticket';
  }

  findAll() {
    return `This action returns all equipmenttickets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} equipmentticket`;
  }

  update(id: number, updateEquipmentticketDto: UpdateEquipmentticketDto) {
    return `This action updates a #${id} equipmentticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} equipmentticket`;
  }
}
