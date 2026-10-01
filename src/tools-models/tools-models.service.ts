import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsModelDto } from './dto/create-tools-model.dto';
import { UpdateToolsModelDto } from './dto/update-tools-model.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { ToolsModel } from './entities/tools-model.entity';
import { Repository } from 'typeorm';
import { FilterToolsModelDto } from './dto/filter-tools-model.dto';

@Injectable()
export class ToolsModelsService {
  private readonly logger = new Logger('ToolsModelsService');
  constructor(
    @InjectRepository(ToolsModel)
    private toolsModelsRepository: Repository<ToolsModel>,
    private readonly i18n: I18nService,
  ) {}

  async create(createToolsModelDto: CreateToolsModelDto) {
    const { brandId, name } = createToolsModelDto;
    const newModel = this.toolsModelsRepository.create({
      name: name,
      brand: { id: brandId },
    });
    try {
      return await this.toolsModelsRepository.save(newModel);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterToolsModelDto) {
    const { limit = 10, offset = 0, query, brandId } = filterDto;

    const queryBuilder = this.toolsModelsRepository
      .createQueryBuilder('toolsModel')
      .leftJoinAndSelect('toolsModel.brand', 'brand')
      .select(['toolsModel.id', 'toolsModel.name', 'brand.id', 'brand.name'])
      .take(limit)
      .skip(offset)
      .orderBy('toolsModel.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('toolsModel.name LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    const [toolsModels, total] = await queryBuilder.getManyAndCount();

    return {
      toolsModels,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateToolsModelDto: UpdateToolsModelDto) {
    try {
      return await this.toolsModelsRepository.update(id, updateToolsModelDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.models.nameAlreadyExists'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(brandId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.models.brandNotFound'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
