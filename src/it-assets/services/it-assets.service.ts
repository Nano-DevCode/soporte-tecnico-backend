import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { CreateItAssetDto } from '../dto/create-it-asset.dto';
import { UpdateItAssetDto } from '../dto/update-it-asset.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAsset } from '../entities/it-asset.entity';
import { DataSource, Repository } from 'typeorm';
import { ItAssetsModel } from 'src/it-assets/models/entities/it-assets-model.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { ItAssetsType } from 'src/it-assets-type/entities/it-assets-type.entity';
import { ItAssetsInvoice } from 'src/it-assets-invoices/entities/it-assets-invoice.entity';
import { I18nService } from 'nestjs-i18n';
import { FilterItAssetBrandDto } from '../dto/filter-it-asset.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilesService, MulterFile } from 'src/files/files.service';
import {
  ItAssetsMovement,
  MovementType,
} from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ChangeStatusItAssetDto } from '../dto/change-status-it-asset.dto';

@Injectable()
export class ItAssetsService {
  private readonly logger = new Logger(ItAssetsService.name);
  constructor(
    @InjectRepository(ItAsset)
    private readonly itAssetRepository: Repository<ItAsset>,
    private readonly i18n: I18nService,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateItAssetDto, file?: MulterFile) {
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const newAsset = transactionManager.create(ItAsset, {
          idInventary: createDto.idInventary,
          serialNumber: createDto.serialNumber,
          description: createDto.description,
          model: { id: createDto.modelId },
          name: createDto.name,
          itAssetStatus: { id: createDto.statusId },
          itAssetsType: { id: createDto.typeId },
          invoice: createDto.invoiceId
            ? { id: createDto.invoiceId }
            : undefined,
        });

        const savedAsset = await transactionManager.save(newAsset);

        const initialMovement = transactionManager.create(ItAssetsMovement, {
          type: MovementType.IN,
          itAsset: savedAsset,
          movementIn: {
            observations: createDto.observations,
            itAssetsStatus: savedAsset.itAssetStatus,
          },
        });
        await transactionManager.save(initialMovement);

        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'it-assets-images',
            savedAsset.id,
          );

          savedAsset.imageUrl = uploadedImage.url;
          return await transactionManager.save(savedAsset);
        }

        return savedAsset;
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

  async findAll(filterDto: FilterItAssetBrandDto) {
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

    const queryBuilder = this.itAssetRepository.createQueryBuilder('itAsset');

    queryBuilder.leftJoinAndSelect('itAsset.model', 'model');
    queryBuilder.leftJoinAndSelect('model.brand', 'brand');
    queryBuilder.leftJoinAndSelect('itAsset.itAssetStatus', 'status');
    queryBuilder.leftJoinAndSelect('itAsset.itAssetsType', 'type');
    queryBuilder.leftJoinAndSelect('itAsset.invoice', 'invoice');

    if (query) {
      queryBuilder.andWhere(
        '("itAsset"."serialNumber" ILIKE :query OR "itAsset"."idInventary" ILIKE :query OR "itAsset"."id"::text ILIKE :query OR "itAsset"."name" ILIKE :query)',
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
      queryBuilder.andWhere('type.id = :typeId', { typeId });
    }
    if (modelId) {
      queryBuilder.andWhere('model.id = :modelId', { modelId });
    }
    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    queryBuilder.take(limit).skip(offset);
    queryBuilder.orderBy('itAsset.createdAt', 'DESC');
    const [itAssets, total] = await queryBuilder.getManyAndCount();

    return {
      itAssets,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const itAsset = await this.itAssetRepository.findOne({
      where: { id },
      relations: {
        model: {
          brand: true,
        },
        itAssetStatus: true,
        itAssetsType: true,
        invoice: true,
      },
    });
    if (!itAsset) {
      throw new NotFoundException(this.i18n.t('errors.itAssets.notFound'));
    }
    return itAsset;
  }

  async update(id: string, updateDto: UpdateItAssetDto, file?: MulterFile) {
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const asset = await transactionManager.findOne(ItAsset, {
          where: { id },
        });

        if (!asset) {
          throw new NotFoundException(
            this.i18n.t('errors.itAssets.notFoundWithId', { args: { id } }),
          );
        }

        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'it-assets-images',
            id,
          );
          asset.imageUrl = uploadedImage.url;
        }

        if (updateDto.idInventary !== undefined)
          asset.idInventary = updateDto.idInventary;
        if (updateDto.name !== undefined) asset.name = updateDto.name;
        if (updateDto.serialNumber) asset.serialNumber = updateDto.serialNumber;
        if (updateDto.description !== undefined)
          asset.description = updateDto.description!;

        if (updateDto.modelId) {
          asset.model = { id: updateDto.modelId } as ItAssetsModel;
        }
        if (updateDto.statusId) {
          asset.itAssetStatus = { id: updateDto.statusId } as ItAssetsStatus;
        }
        if (updateDto.typeId) {
          asset.itAssetsType = { id: updateDto.typeId } as ItAssetsType;
        }
        if (updateDto.invoiceId !== undefined) {
          asset.invoice = updateDto.invoiceId
            ? ({ id: updateDto.invoiceId } as ItAssetsInvoice)
            : (null as unknown as ItAssetsInvoice);
        }

        return await transactionManager.save(asset);
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

  async changeStatus(
    id: string,
    changeStatusItAssetDto: ChangeStatusItAssetDto,
  ) {
    const { status } = changeStatusItAssetDto;
    const asset = await this.itAssetRepository.preload({
      id,
      status,
    });

    if (!asset) {
      throw new NotFoundException(
        this.i18n.t('errors.itAssets.notFoundWithId', { args: { id } }),
      );
    }

    return this.itAssetRepository.save(asset);
  }

  private handleDBExeptions(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('("idInventary")=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.inventoryAlreadyExists'),
        );
      }
      if (dbError.detail?.includes('("serialNumber")=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.serialNumberAlreadyExists'),
        );
      }
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(modelId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.modelNotFound'),
        );
      }
      if (dbError.detail?.includes('(itAssetStatusId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.statusNotFound'),
        );
      }
      if (dbError.detail?.includes('(itAssetsTypeId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.typeNotFound'),
        );
      }
      if (dbError.detail?.includes('(invoiceId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.invoiceNotFound'),
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
