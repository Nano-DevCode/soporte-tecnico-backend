import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateToolDto } from '../dto/create-tool.dto';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tool } from '../entities/tool.entity';
import { DataSource, In, Repository } from 'typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolDto } from '../dto/filter-tool.dto';
import { ChangeStatusToolDto } from '../dto/change-status-tool.dto';
import { I18nService } from 'nestjs-i18n';
import { FilesService, type MulterFile } from 'src/files/files.service';
import { FindByIdsDto } from '../dto/find-by-ids.dto';
import {
  MovementType,
  ToolsMovement,
} from 'src/tools-movements/entities/tools-movement.entity';
import { ToolsModel } from 'src/tools-models/entities/tools-model.entity';
import { ToolsStatus } from 'src/tools-status/entities/tools-status.entity';
import { ToolsType } from 'src/tools-types/entities/tools-type.entity';
import { ToolsInvoice } from 'src/tools-invoices/entities/tools-invoice.entity';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger('ToolsService');
  constructor(
    @InjectRepository(Tool)
    private readonly toolsRepository: Repository<Tool>,
    private readonly i18n: I18nService,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateToolDto, file?: MulterFile) {
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const newTool = transactionManager.create(Tool, {
          idInventary: createDto.idInventary,
          description: createDto.description,
          model: { id: createDto.modelId },
          toolStatus: { id: createDto.statusId },
          toolType: { id: createDto.typeId },
          name: createDto.name,
          invoice: createDto.invoiceId
            ? { id: createDto.invoiceId }
            : undefined,
        });

        const savedTool = await transactionManager.save(newTool);

        const initialMovement = transactionManager.create(ToolsMovement, {
          type: MovementType.IN,
          tool: savedTool,
          movementIn: {
            observations: createDto.observations,
            toolStatus: savedTool.toolStatus,
          },
        });
        await transactionManager.save(initialMovement);

        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'tools-images',
            savedTool.id,
          );

          savedTool.imageUrl = uploadedImage.url;
          return await transactionManager.save(savedTool);
        }

        return savedTool;
      });
    } catch (error) {
      const imgToRevert = uploadedImage as {
        fileName: string;
        url: string;
        bucket: string;
      } | null;

      if (imgToRevert) {
        await this.filesService.deleteFile(
          imgToRevert.bucket,
          imgToRevert.fileName,
        );
      }

      this.handleDBExeptions(error);
    }
  }

  async findByIds(idsDto: FindByIdsDto) {
    const { ids } = idsDto;
    if (!ids || ids.length === 0) {
      return [];
    }

    const tools = await this.toolsRepository.find({
      where: {
        id: In(ids),
        status: true,
        inUse: false,
      },
      relations: ['model', 'model.brand', 'toolType'],
    });

    return tools;
  }

  async findAll(filterDto: FilterToolDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      status,
      invoiceId,
      typeId,
      modelId,
      brandId,
    } = filterDto;

    const queryBuilder = this.toolsRepository.createQueryBuilder('tool');

    queryBuilder.leftJoinAndSelect('tool.model', 'model');
    queryBuilder.leftJoinAndSelect('model.brand', 'brand');
    queryBuilder.leftJoinAndSelect('tool.toolStatus', 'toolStatus');
    queryBuilder.leftJoinAndSelect('tool.toolType', 'toolType');
    queryBuilder.leftJoinAndSelect('tool.invoice', 'invoice');

    if (query) {
      queryBuilder.andWhere(
        '("tool"."idInventary" ILIKE :query OR "tool"."id"::text ILIKE :query OR "tool"."name" ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    if (status != undefined) {
      queryBuilder.andWhere('status = :status', { status });
    }
    if (invoiceId) {
      queryBuilder.andWhere('invoice.id = :invoiceId', { invoiceId });
    }
    if (typeId) {
      queryBuilder.andWhere('toolType.id = :typeId', { typeId });
    }
    if (modelId) {
      queryBuilder.andWhere('model.id = :modelId', { modelId });
    }
    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    queryBuilder.take(limit).skip(offset);
    queryBuilder.orderBy('tool.updatedAt', 'DESC');
    const [tools, total] = await queryBuilder.getManyAndCount();

    return {
      tools: tools,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tool = await this.toolsRepository.findOne({
      where: { id },
      relations: {
        model: {
          brand: true,
        },
        toolStatus: true,
        toolType: true,
        invoice: true,
      },
    });
    if (!tool) {
      throw new NotFoundException(this.i18n.t('errors.tools.notFound'));
    }
    return tool;
  }

  async update(id: string, updateDto: UpdateToolDto, file?: MulterFile) {
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const tool = await transactionManager.findOne(Tool, {
          where: { id },
        });

        if (!tool) {
          throw new NotFoundException(
            this.i18n.t('errors.tools.notFoundWithId', { args: { id } }),
          );
        }

        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'tools-images',
            id,
          );
          tool.imageUrl = uploadedImage.url;
        }

        if (updateDto.idInventary !== undefined)
          tool.idInventary = updateDto.idInventary;
        if (updateDto.name !== undefined) tool.name = updateDto.name;
        if (updateDto.description !== undefined)
          tool.description = updateDto.description!;

        if (updateDto.modelId) {
          tool.model = { id: updateDto.modelId } as ToolsModel;
        }
        if (updateDto.statusId) {
          tool.toolStatus = { id: updateDto.statusId } as ToolsStatus;
        }
        if (updateDto.typeId) {
          tool.toolType = { id: updateDto.typeId } as ToolsType;
        }
        if (updateDto.invoiceId !== undefined) {
          tool.invoice = updateDto.invoiceId
            ? ({ id: updateDto.invoiceId } as ToolsInvoice)
            : null;
        }

        return await transactionManager.save(tool);
      });
    } catch (error) {
      const imgToRevert = uploadedImage as {
        fileName: string;
        url: string;
        bucket: string;
      } | null;

      if (imgToRevert) {
        await this.filesService.deleteFile(
          imgToRevert.bucket,
          imgToRevert.fileName,
        );
      }

      this.handleDBExeptions(error);
    }
  }

  async changeStatus(id: string, changeStatusToolDto: ChangeStatusToolDto) {
    const { status } = changeStatusToolDto;
    const tool = await this.toolsRepository.preload({
      id,
      status,
    });

    if (!tool) {
      throw new NotFoundException(
        this.i18n.t('errors.tools.notFoundWithId', { args: { id } }),
      );
    }

    return this.toolsRepository.save(tool);
  }

  private handleDBExeptions(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('("idInventary")=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.inventoryAlreadyExists'),
        );
      }
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(modelId)=')) {
        throw new ConflictException(this.i18n.t('errors.tools.modelNotFound'));
      }
      if (dbError.detail?.includes('(toolStatusId)=')) {
        throw new ConflictException(this.i18n.t('errors.tools.statusNotFound'));
      }
      if (dbError.detail?.includes('(toolsTypeId)=')) {
        throw new ConflictException(this.i18n.t('errors.tools.typeNotFound'));
      }
      if (dbError.detail?.includes('(invoiceId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.invoiceNotFound'),
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
