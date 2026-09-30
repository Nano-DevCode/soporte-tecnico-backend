import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';
import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MaintenanceType } from './entities/maintenance-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MaintenanceTypeService {
  constructor(
    @InjectRepository(MaintenanceType)
    private readonly maintenanceTypeRepository: Repository<MaintenanceType>,
  ) {}

  create(createMaintenanceTypeDto: CreateMaintenanceTypeDto) {
    const mantainenceType = this.maintenanceTypeRepository.create(
      createMaintenanceTypeDto,
    );
    return this.maintenanceTypeRepository.save(mantainenceType);
  }

  findAll() {
    return this.maintenanceTypeRepository.find();
  }

  async findOneOrFail(id: string) {
    const issueTypeDb = await this.maintenanceTypeRepository.findOneBy({ id });
    if (!issueTypeDb)
      throw new NotFoundException(
        `El tipo de mantenimiento con ID ${id} no existe.`,
      );
    return issueTypeDb;
  }

  update(id: number, updateMaintenanceTypeDto: UpdateMaintenanceTypeDto) {
    return updateMaintenanceTypeDto;
  }

  async deleteAll() {
    // return await this.issueTypeRepository.deleteAll();
    await this.maintenanceTypeRepository.query(
      'TRUNCATE TABLE "maintenance_type" RESTART IDENTITY CASCADE',
    );
  }
}
