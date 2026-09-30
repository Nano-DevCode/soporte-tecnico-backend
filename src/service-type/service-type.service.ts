import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceType } from './entities/service-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  create(createServiceTypeDto: CreateServiceTypeDto) {
    const serviceType = this.serviceTypeRepository.create(createServiceTypeDto);
    return this.serviceTypeRepository.save(serviceType);
  }

  findAll() {
    return this.serviceTypeRepository.find();
  }

  async findOneOrFail(id: string) {
    const serviceType = await this.serviceTypeRepository.findOneBy({ id });
    if (!serviceType)
      throw new NotFoundException(
        `El tipo de mantenimiento con ID ${id} no existe.`,
      );
    return serviceType;
  }

  async deleteAll() {
    // return await this.issueTypeRepository.deleteAll();
    await this.serviceTypeRepository.query(
      'TRUNCATE TABLE "service_type" RESTART IDENTITY CASCADE',
    );
  }
}
