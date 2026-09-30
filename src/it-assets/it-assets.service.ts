import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { CreateItAssetDto } from './dto/create-it-asset.dto';
import { UpdateItAssetDto } from './dto/update-it-asset.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAsset } from './entities/it-asset.entity';
import { DataSource, Repository } from 'typeorm';
import { ItAssetsModel } from 'src/it-assets-models/entities/it-assets-model.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { ItAssetsType } from 'src/it-assets-type/entities/it-assets-type.entity';
import { ItAssetsInvoice } from 'src/it-assets-invoices/entities/it-assets-invoice.entity';
import { I18nService } from 'nestjs-i18n';
import { FilterItAssetBrandDto } from './dto/filter-it-asset.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilesService, MulterFile } from 'src/files/files.service';
import {
  ItAssetsMovement,
  MovementType,
} from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ChangeStatusItAssetDto } from './dto/change-status-it-asset.dto';

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

  async create(createDto: CreateItAssetDto, file: MulterFile) {
    // Declaramos esto afuera para poder borrar la imagen en el catch si es necesario
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      // Iniciamos la transaccion
      return await this.dataSource.transaction(async (transactionManager) => {
        // 1. Preparamos el Asset sin la imagen
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

        // 2. Guardamos la primera vez para que PostgreSQL genere el ID.
        // Si hay un error de llave duplicada o foranea, fallara aqui antes de subir nada.
        const savedAsset = await transactionManager.save(newAsset);

        // Creamos la la entrada en la tabla de entradas
        const initialMovement = transactionManager.create(ItAssetsMovement, {
          type: MovementType.IN,
          itAsset: savedAsset,
          movementIn: {
            observations: createDto.observations,
            itAssetsStatus: savedAsset.itAssetStatus,
          },
        });
        await transactionManager.save(initialMovement);

        // 3. Verificamos si viene una imagen antes de intentar subirla
        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'it-assets-images',
            savedAsset.id, // Le pasas el ID del activo
          );

          // 4. Actualizamos la URL en el objeto y volvemos a guardar
          savedAsset.imageUrl = uploadedImage.url;
          return await transactionManager.save(savedAsset);
        }

        // Si no hay imagen, retornamos el activo tal como se guardó en el paso 2
        return savedAsset;
      });
    } catch (error) {
      // Creamos una referencia forzando el tipo original para que TS no se confunda
      const imgToRevert = uploadedImage as {
        fileName: string;
        url: string;
        bucket: string;
      } | null;

      // Usamos la nueva variable para la validación y el borrado
      if (imgToRevert) {
        await this.filesService.deleteFile(
          imgToRevert.bucket,
          imgToRevert.fileName,
        );
      }

      // Mandamos el error al manejador para que le responda al usuario
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

    // 1. Unimos las relaciones
    queryBuilder.leftJoinAndSelect('itAsset.model', 'model');
    queryBuilder.leftJoinAndSelect('model.brand', 'brand');
    queryBuilder.leftJoinAndSelect('itAsset.itAssetStatus', 'status');
    queryBuilder.leftJoinAndSelect('itAsset.itAssetsType', 'type');
    queryBuilder.leftJoinAndSelect('itAsset.invoice', 'invoice');

    // 2. Aplicamos la busqueda general
    if (query) {
      queryBuilder.andWhere(
        '("itAsset"."serialNumber" ILIKE :query OR "itAsset"."idInventary" ILIKE :query OR "itAsset"."id"::text ILIKE :query OR "itAsset"."name" ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // 3. Aplicamos los filtros
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

    // 4. Aplicamos paginacion
    queryBuilder.take(limit).skip(offset);

    // 5. Ejecutamos la consulta y ordenamos por fecha de creación descendente
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
    // Declaramos esto afuera para el rollback manual si la BD falla después de subir la foto
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        // 1. Buscamos el activo existente para asegurarnos de que exista
        const asset = await transactionManager.findOne(ItAsset, {
          where: { id },
        });

        if (!asset) {
          throw new NotFoundException(
            this.i18n.t('errors.itAssets.notFoundWithId', { args: { id } }),
          );
        }

        // 2. Si el usuario envio una nueva imagen, la procesamos
        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'it-assets-images',
            id,
          );
          asset.imageUrl = uploadedImage.url;
        }

        // 3. Actualizamos los campos de texto si vienen en el DTO
        if (updateDto.idInventary !== undefined)
          asset.idInventary = updateDto.idInventary;
        if (updateDto.name !== undefined) asset.name = updateDto.name;
        if (updateDto.serialNumber) asset.serialNumber = updateDto.serialNumber;
        if (updateDto.description !== undefined)
          asset.description = updateDto.description!;

        // 4. Actualizamos las relaciones de forma segura (y tipada)
        if (updateDto.modelId) {
          asset.model = { id: updateDto.modelId } as ItAssetsModel;
        }
        if (updateDto.statusId) {
          asset.itAssetStatus = { id: updateDto.statusId } as ItAssetsStatus;
        }
        if (updateDto.typeId) {
          asset.itAssetsType = { id: updateDto.typeId } as ItAssetsType;
        }
        // Si invoiceId viene como null o string vacío, rompemos la relación, si viene un UUID la creamos
        if (updateDto.invoiceId !== undefined) {
          asset.invoice = updateDto.invoiceId
            ? ({ id: updateDto.invoiceId } as ItAssetsInvoice)
            : (null as unknown as ItAssetsInvoice);
        }

        // 5. Guardamos los cambios (TypeORM ejecutará un UPDATE en la base de datos)
        return await transactionManager.save(asset);
      });
    } catch (error) {
      // Aplicamos el truco del casteo para evitar el error de tipo 'never' en TS
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

      // Procesamos duplicados o llaves foráneas inexistentes introducidas en el update
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

  private handleDBExeptions(error: any): never {
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
