import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsTypeDto } from '../dto/create-tools-type.dto';
import { UpdateToolsTypeDto } from '../dto/update-tools-type.dto';
import { ToolsType } from '../entities/tools-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolsTypeDto } from '../dto/filter-tools-type.dto';

@Injectable()
export class ToolsTypesService {
  private readonly logger = new Logger('ToolsTypeService');
  constructor(
    @InjectRepository(ToolsType)
    private readonly toolsTypeRepository: Repository<ToolsType>,
    private readonly i18n: I18nService,
  ) {}

  async create(createToolsTypeDto: CreateToolsTypeDto) {
    const toolsType = this.toolsTypeRepository.create(createToolsTypeDto);
    try {
      return await this.toolsTypeRepository.save(toolsType);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(filterDto: FilterToolsTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.toolsTypeRepository
      .createQueryBuilder('toolsType')
      .select(['toolsType.id', 'toolsType.name'])
      .take(limit)
      .skip(offset)
      .orderBy('toolsType.name', 'ASC');
    if (query) {
      queryBuilder.andWhere('toolsType.name LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }
    const [toolsTypes, total] = await queryBuilder.getManyAndCount();

    return {
      toolsTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateToolsTypeDto: UpdateToolsTypeDto) {
    try {
      return await this.toolsTypeRepository.update(id, updateToolsTypeDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.types.nameAlreadyExists', {
            args: { name: dbError.detail.split('=')[1] },
          }),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    if (dbError.code === '23503') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
