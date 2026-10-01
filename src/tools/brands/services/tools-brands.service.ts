import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsBrandDto } from '../dto/create-tools-brand.dto';
import { UpdateToolsBrandDto } from '../dto/update-tools-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToolsBrand } from '../entities/tools-brand.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolsBrandDto } from '../dto/filter-tools-brand.dto';

@Injectable()
export class ToolsBrandsService {
  private readonly logger = new Logger('ToolsBrandsService');
  constructor(
    @InjectRepository(ToolsBrand)
    private readonly toolsBrandRepository: Repository<ToolsBrand>,
    private readonly i18n: I18nService,
  ) {}

  async create(createToolsBrandDto: CreateToolsBrandDto) {
    const toolsBrand = this.toolsBrandRepository.create(createToolsBrandDto);
    try {
      return await this.toolsBrandRepository.save(toolsBrand);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(filterDto: FilterToolsBrandDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.toolsBrandRepository
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
      toolsBrands,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateToolsBrandDto: UpdateToolsBrandDto) {
    try {
      return await this.toolsBrandRepository.update(id, updateToolsBrandDto);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.brands.nameAlreadyExists', {
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
