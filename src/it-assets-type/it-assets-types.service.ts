import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsTypeDto } from './dto/create-it-assets-type.dto';
import { UpdateItAssetsTypeDto } from './dto/update-it-assets-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAssetsType } from './entities/it-assets-type.entity';
import { Repository } from 'typeorm';
import { FilterItAssetsTypeDto } from './dto/filter-it-assets-type.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsTypesService {
  private readonly logger = new Logger('ItAssetsTypeService');
  constructor(
    @InjectRepository(ItAssetsType)
    private readonly itAssetsTypeRepository: Repository<ItAssetsType>,
    private readonly i18n: I18nService,
  ) {}
  async create(createItAssetsTypeDto: CreateItAssetsTypeDto) {
    const itAssetsType = this.itAssetsTypeRepository.create(
      createItAssetsTypeDto,
    );
    try {
      return await this.itAssetsTypeRepository.save(itAssetsType);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterItAssetsTypeDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.itAssetsTypeRepository
      .createQueryBuilder('itAssetsType')
      .select(['itAssetsType.id', 'itAssetsType.name'])
      .take(limit)
      .skip(offset)
      .orderBy('itAssetsType.name', 'ASC');
    if (query) {
      queryBuilder.andWhere('LOWER(itAssetsType.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }
    const [itAssetsTypes, total] = await queryBuilder.getManyAndCount();

    return {
      itAssetsTypes: itAssetsTypes,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  update(id: number, updateItAssetsTypeDto: UpdateItAssetsTypeDto) {
    try {
      return this.itAssetsTypeRepository.update(id, updateItAssetsTypeDto);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: any): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(name)=')) {
        throw new BadRequestException(
          this.i18n.t('errors.itAssetsTypes.nameAlreadyExists', {
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
