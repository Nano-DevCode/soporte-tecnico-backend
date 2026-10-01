import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsBrandDto } from './dto/create-tools-brand.dto';
import { UpdateToolsBrandDto } from './dto/update-tools-brand.dto';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { ToolsBrand } from './entities/tools-brand.entity';
import { Repository } from 'typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolsBrandDto } from './dto/filter-tools-brand.dto';

@Injectable()
export class ToolsBrandsService {
  private readonly logger = new Logger('ToolsBrandsService');
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(ToolsBrand)
    private readonly toolsBrandsRepository: Repository<ToolsBrand>,
  ) {}

  async create(createToolsBrandDto: CreateToolsBrandDto) {
    try {
      const toolsBrand = this.toolsBrandsRepository.create(createToolsBrandDto);
      return await this.toolsBrandsRepository.save(toolsBrand);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterToolsBrandDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.toolsBrandsRepository
      .createQueryBuilder('toolsBrand')
      .select(['toolsBrand.id', 'toolsBrand.name'])
      .take(limit)
      .skip(offset)
      .orderBy('toolsBrand.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('toolsBrand.name LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }
    const [toolsBrands, total] = await queryBuilder.getManyAndCount();

    return {
      toolsBrands: toolsBrands,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateToolsBrandDto: UpdateToolsBrandDto) {
    try {
      return await this.toolsBrandsRepository.update(id, updateToolsBrandDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.brands.nameAlreadyExists'),
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
