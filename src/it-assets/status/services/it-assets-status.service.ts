import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsStatusDto } from '../dto/create-it-assets-status.dto';
import { UpdateItAssetsStatusDto } from '../dto/update-it-assets-status.dto';
import { ItAssetsStatus } from '../entities/it-assets-status.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { seedItAssetsStatus } from '../data/it-assets-status.data';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsStatusService {
  private readonly logger = new Logger('ItAssetsStatusService');
  constructor(
    @InjectRepository(ItAssetsStatus)
    private readonly itAssetsStatusRepository: Repository<ItAssetsStatus>,
    private readonly i18n: I18nService,
  ) {}

  async create(createItAssetsStatusDto: CreateItAssetsStatusDto) {
    try {
      const itAssetsStatus = this.itAssetsStatusRepository.create(
        createItAssetsStatusDto,
      );
      await this.itAssetsStatusRepository.save(itAssetsStatus);
      return itAssetsStatus;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll() {
    const itAssetsStatus = await this.itAssetsStatusRepository.find();
    return { itAssetsStatus: itAssetsStatus };
  }

  update(id: string, updateItAssetsStatusDto: UpdateItAssetsStatusDto) {
    try {
      return this.itAssetsStatusRepository.update(id, updateItAssetsStatusDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async seed() {
    try {
      const promises = seedItAssetsStatus.map((status) => this.create(status));
      await Promise.all(promises);
      return { complete: true };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23503') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
