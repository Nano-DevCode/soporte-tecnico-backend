import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsModelDto } from './dto/create-it-assets-model.dto';
import { UpdateItAssetsModelDto } from './dto/update-it-assets-model.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAssetsModel } from './entities/it-assets-model.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterItAssetsModelDto } from './dto/filter-it-assets-model.dto';

@Injectable()
export class ItAssetsModelsService {
  private readonly logger = new Logger('ItAssetsModelsService');
  constructor(
    @InjectRepository(ItAssetsModel)
    private itAssetsModelsRepository: Repository<ItAssetsModel>,
    private readonly i18n: I18nService,
  ) {}

  async create(createItAssetsModelDto: CreateItAssetsModelDto) {
    const { brandId, name } = createItAssetsModelDto;
    const newModel = this.itAssetsModelsRepository.create({
      name: name,
      brand: { id: brandId },
    });
    try {
      return await this.itAssetsModelsRepository.save(newModel);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterItAssetsModelDto) {
    const { limit = 10, offset = 0, query, brandId } = filterDto;

    const queryBuilder = this.itAssetsModelsRepository
      .createQueryBuilder('itAssetsModel')
      .leftJoinAndSelect('itAssetsModel.brand', 'brand')
      .select([
        'itAssetsModel.id',
        'itAssetsModel.name',
        'brand.id',
        'brand.name',
      ])
      .take(limit)
      .skip(offset)
      .orderBy('itAssetsModel.name', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(itAssetsModel.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    const [itAssetsModels, total] = await queryBuilder.getManyAndCount();

    return {
      itAssetsModels,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  update(id: string, updateItAssetsModelDto: UpdateItAssetsModelDto) {
    try {
      return this.itAssetsModelsRepository.preload({
        id,
        ...updateItAssetsModelDto,
      });
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.models.nameAlreadyExists'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(brandId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.models.brandNotFound'),
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
