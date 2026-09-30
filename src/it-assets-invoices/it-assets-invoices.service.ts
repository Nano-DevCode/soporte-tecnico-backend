import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsInvoiceDto } from './dto/create-it-assets-invoice.dto';
import { UpdateItAssetsInvoiceDto } from './dto/update-it-assets-invoice.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAssetsInvoice } from './entities/it-assets-invoice.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { FilterItAssetsInvoiceDto } from './dto/filter-it-assets-invoice.dto';

@Injectable()
export class ItAssetsInvoicesService {
  private readonly logger = new Logger('ItAssetsInvoicesService');
  constructor(
    @InjectRepository(ItAssetsInvoice)
    private readonly itAssetsInvoiceRepository: Repository<ItAssetsInvoice>,
    private readonly i18n: I18nService,
  ) {}

  async create(createItAssetsInvoiceDto: CreateItAssetsInvoiceDto) {
    const newInvoice = this.itAssetsInvoiceRepository.create(
      createItAssetsInvoiceDto,
    );
    try {
      return await this.itAssetsInvoiceRepository.save(newInvoice);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterItAssetsInvoiceDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.itAssetsInvoiceRepository
      .createQueryBuilder('itAssetsInvoice')
      .select(['itAssetsInvoice.id', 'itAssetsInvoice.idInternal'])
      .take(limit)
      .skip(offset)
      .orderBy('itAssetsInvoice.idInternal', 'ASC');

    if (query) {
      queryBuilder.andWhere('LOWER(itAssetsInvoice.idInternal) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [itAssetsInvoices, total] = await queryBuilder.getManyAndCount();

    return {
      itAssetsInvoices: itAssetsInvoices,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  update(id: string, updateItAssetsInvoiceDto: UpdateItAssetsInvoiceDto) {
    try {
      return this.itAssetsInvoiceRepository.update(
        id,
        updateItAssetsInvoiceDto,
      );
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: any): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(idInternal)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.invoices.internalIdAlreadyExists'),
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
