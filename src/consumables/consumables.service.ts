import { Injectable } from '@nestjs/common';
import { Consumable } from './entities/consumable.entity';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FilterConsumableDto } from './dto/filter-consumable.dto';
import { type MulterFile } from 'src/files/files.service';
import { ConsumablesCrudService } from './services/consumables-crud.service';

@Injectable()
export class ConsumablesService {
  constructor(private readonly crudService: ConsumablesCrudService) {}

  public create(
    createDto: CreateConsumableDto,
    file?: MulterFile,
  ): Promise<Consumable> {
    return this.crudService.create(createDto, file);
  }

  public update(
    id: string,
    updateDto: UpdateConsumableDto,
    file?: MulterFile,
  ): Promise<Consumable> {
    return this.crudService.update(id, updateDto, file);
  }

  public findAll(filterDto: FilterConsumableDto) {
    return this.crudService.findAll(filterDto);
  }

  public findOne(id: string): Promise<Consumable> {
    return this.crudService.findOne(id);
  }

  public remove(id: string) {
    return this.crudService.remove(id);
  }
}
