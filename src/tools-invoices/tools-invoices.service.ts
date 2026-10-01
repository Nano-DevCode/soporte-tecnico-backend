import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsInvoiceDto } from './dto/create-tools-invoice.dto';
import { UpdateToolsInvoiceDto } from './dto/update-tools-invoice.dto';
import { ToolsInvoice } from './entities/tools-invoice.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolsInvoiceDto } from './dto/filter-tools-invoice.dto';

@Injectable()
export class ToolsInvoicesService {
  private readonly logger = new Logger('ToolsInvoicesService');
  constructor(
    @InjectRepository(ToolsInvoice)
    private readonly toolsInvoiceRepository: Repository<ToolsInvoice>,
    private readonly i18n: I18nService,
  ) {}

  async create(createToolsInvoiceDto: CreateToolsInvoiceDto) {
    const newInvoice = this.toolsInvoiceRepository.create(
      createToolsInvoiceDto,
    );
    try {
      return await this.toolsInvoiceRepository.save(newInvoice);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterToolsInvoiceDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.toolsInvoiceRepository
      .createQueryBuilder('toolsInvoice')
      .select(['toolsInvoice.id', 'toolsInvoice.idInternal'])
      .take(limit)
      .skip(offset)
      .orderBy('toolsInvoice.idInternal', 'ASC');

    if (query) {
      queryBuilder.andWhere('toolsInvoice.idInternal LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    const [toolsInvoices, total] = await queryBuilder.getManyAndCount();

    return {
      toolsInvoices: toolsInvoices,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateToolsInvoiceDto: UpdateToolsInvoiceDto) {
    try {
      return await this.toolsInvoiceRepository.update(
        id,
        updateToolsInvoiceDto,
      );
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(idInternal)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.invoices.internalIdAlreadyExists'),
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
