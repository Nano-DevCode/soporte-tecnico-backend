import { Injectable } from '@nestjs/common';
import { CreateFaultValidityDto } from './dto/create-fault-validity.dto';
import { FaultValidity } from './entities/fault-validity.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FaultValiditiesService {
  constructor(
    @InjectRepository(FaultValidity)
    private readonly faultValidityRepository: Repository<FaultValidity>,
  ) {}

  async create(createFaultValidityDto: CreateFaultValidityDto) {
    const faultValidity = this.faultValidityRepository.create(
      createFaultValidityDto,
    );
    await this.faultValidityRepository.save(faultValidity);
    return faultValidity;
  }

  async deleteAll() {
    await this.faultValidityRepository.query(
      'TRUNCATE TABLE "fault_validity" RESTART IDENTITY CASCADE',
    );
  }

  findAll() {
    return this.faultValidityRepository.find();
  }
}
