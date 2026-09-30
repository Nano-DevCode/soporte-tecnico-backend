import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsBrandDto } from './dto/create-it-assets-brand.dto';
import { UpdateItAssetsBrandDto } from './dto/update-it-assets-brand.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAssetsBrand } from './entities/it-assets-brand.entity';
import { Repository } from 'typeorm';
import { FilterItAssetsBrandDto } from './dto/filter-it-assets-brand.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsBrandsService {
  private readonly logger = new Logger('ItAssetsBrandsService');
  constructor(
    @InjectRepository(ItAssetsBrand)
    private readonly itAssetsBrandsRepository: Repository<ItAssetsBrand>,
    private readonly i18n: I18nService,
  ) {}

  async create(createItAssetsBrandDto: CreateItAssetsBrandDto) {
    try {
      const itAssetsBrand = this.itAssetsBrandsRepository.create(
        createItAssetsBrandDto,
      );
      return await this.itAssetsBrandsRepository.save(itAssetsBrand);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterItAssetsBrandDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.itAssetsBrandsRepository
      .createQueryBuilder('itAssetsBrand')
      .select(['itAssetsBrand.id', 'itAssetsBrand.name'])
      .take(limit)
      .skip(offset)
      .orderBy('itAssetsBrand.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(itAssetsBrand.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }
    const [itAssetsBrands, total] = await queryBuilder.getManyAndCount();

    return {
      itAssetsBrands: itAssetsBrands,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  update(id: number, updateItAssetsBrandDto: UpdateItAssetsBrandDto) {
    try {
      return this.itAssetsBrandsRepository.update(id, updateItAssetsBrandDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: any): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.brands.nameAlreadyExists'),
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
