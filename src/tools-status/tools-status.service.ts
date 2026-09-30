import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsStatusDto } from './dto/create-tools-status.dto';
import { UpdateToolsStatusDto } from './dto/update-tools-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToolsStatus } from './entities/tools-status.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { seedToolsStatus } from './data/tools-status.data';
import { DatabaseError } from 'src/interfaces/DatabaseError';

@Injectable()
export class ToolsStatusService {
  private readonly logger = new Logger('ToolsStatusService');
  constructor(
    @InjectRepository(ToolsStatus)
    private readonly toolsStatusRepository: Repository<ToolsStatus>,
    private readonly i18n: I18nService,
  ) {}

  async create(createToolsStatusDto: CreateToolsStatusDto) {
    try {
      const toolsStatus =
        this.toolsStatusRepository.create(createToolsStatusDto);
      await this.toolsStatusRepository.save(toolsStatus);
      return toolsStatus;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll() {
    const toolsStatus = await this.toolsStatusRepository.find();
    return { toolsStatus: toolsStatus };
  }

  async update(id: number, updateToolsStatusDto: UpdateToolsStatusDto) {
    try {
      return await this.toolsStatusRepository.update(id, updateToolsStatusDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async seed() {
    try {
      const promises = seedToolsStatus.map((status) => this.create(status));

      await Promise.all(promises);

      return { complete: true };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: any): never {
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
