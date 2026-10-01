import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCoordinationDto } from '../dto/create-coordination.dto';
import { UpdateCoordinationDto } from '../dto/update-coordination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coordination } from '../entities/coordination.entity';

interface DatabaseError extends Error {
  code?: string | number;
  detail?: string;
}

@Injectable()
export class CoordinationsService {
  private readonly logger = new Logger(CoordinationsService.name);

  constructor(
    @InjectRepository(Coordination)
    private readonly coordinationRepository: Repository<Coordination>,
  ) {}

  async create(createCoordinationDto: CreateCoordinationDto) {
    try {
      const coordination = this.coordinationRepository.create(
        createCoordinationDto,
      );
      return await this.coordinationRepository.save(coordination);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    return await this.coordinationRepository.find();
  }

  async findOne(id: string) {
    return await this.coordinationRepository.findOneBy({ id });
  }

  async findUnCordination() {
    const coordination = await this.coordinationRepository.findOne({
      where: {
        name: 'Sin Coordinación',
      },
    });
    if (!coordination) {
      throw new NotFoundException('Coordination not found');
    }
    return coordination.id;
  }

  async update(id: string, updateCoordinationDto: UpdateCoordinationDto) {
    const coordination = await this.coordinationRepository.preload({
      id: id,
      ...updateCoordinationDto,
    });
    if (!coordination) {
      throw new BadRequestException(`Coordination with id ${id} not found`);
    }
    try {
      return await this.coordinationRepository.save(coordination);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async deleteAllCoordinations() {
    try {
      await this.coordinationRepository.clear();
      return { deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      throw new BadRequestException(dbError.detail);
    }
    if (dbError.code === '23503') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check the server logs',
    );
  }
}

