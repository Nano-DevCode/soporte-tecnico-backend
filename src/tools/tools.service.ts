import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { DataSource, In, Repository } from 'typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { FilterToolDto } from './dto/filter-tool.dto';
import { ChangeStatusToolDto } from './dto/change-status-tool.dto';
import { I18nService } from 'nestjs-i18n';
import { FilesService, type MulterFile } from 'src/files/files.service';
import { FindByIdsDto } from './dto/find-by-ids.dto';
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
    // Declaramos esto afuera para poder borrar la imagen en el catch si es necesario
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      // Iniciamos la transaccion
      return await this.dataSource.transaction(async (transactionManager) => {
        // 1. Preparamos el Tool sin la imagen
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

        // 2. Guardamos la primera vez para que PostgreSQL genere el ID.
        // Si hay un error de llave duplicada o foranea, fallará aqui antes de subir nada.
        const savedTool = await transactionManager.save(newTool);

        // Creamos la la entrada en la tabla de entradas
        const initialMovement = transactionManager.create(ToolsMovement, {
          type: MovementType.IN,
          tool: savedTool,
          movementIn: {
            observations: createDto.observations,
            toolStatus: savedTool.toolStatus,
          },
        });
        await transactionManager.save(initialMovement);

        // 3. Verificamos si viene una imagen antes de subirla
        if (file) {
          uploadedImage = await this.filesService.uploadFile(
            file,
            'tools-images',
            savedTool.id,
          );

          // 4. Actualizamos la URL en el objeto y volvemos a guardar
          savedTool.imageUrl = uploadedImage.url;
          return await transactionManager.save(savedTool);
        }

        // Si no hay archivo, simplemente retornamos la herramienta guardada inicialmente
        return savedTool;
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

    // 1. Unimos las relaciones
    queryBuilder.leftJoinAndSelect('tool.model', 'model');
    queryBuilder.leftJoinAndSelect('model.brand', 'brand');
    queryBuilder.leftJoinAndSelect('tool.toolStatus', 'toolStatus');
    queryBuilder.leftJoinAndSelect('tool.toolType', 'toolType');
    queryBuilder.leftJoinAndSelect('tool.invoice', 'invoice');

    // 2. Aplicamos la búsqueda general
    if (query) {
      queryBuilder.andWhere(
        '("tool"."idInventary" ILIKE :query OR "tool"."id"::text ILIKE :query OR "tool"."name" ILIKE :query)',
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
      queryBuilder.andWhere('toolType.id = :typeId', { typeId });
    }
    if (modelId) {
      queryBuilder.andWhere('model.id = :modelId', { modelId });
    }
    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    // 4. Aplicamos paginacion
    queryBuilder.take(limit).skip(offset);

    // 5. Ejecutamos la consulta y ordenamos por fecha de actualizacion descendente
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
    // Declaramos esto afuera para el rollback manual si la BD falla despues de subir la foto
    let uploadedImage: {
      fileName: string;
      url: string;
      bucket: string;
    } | null = null;

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        // 1. Buscamos el activo existente para asegurarnos de que exista
        const tool = await transactionManager.findOne(Tool, {
          where: { id },
        });

        if (!tool) {
          throw new NotFoundException(
            this.i18n.t('errors.tools.notFoundWithId', { args: { id } }),
          );
        }

        // 2. Si el usuario envió una nueva imagen, la procesamos
        if (file) {
          // Tu filesService ya limpia versiones viejas internamente si pasas el mismo ID
          uploadedImage = await this.filesService.uploadFile(
            file,
            'tools-images',
            id, // Seguimos usando el ID del activo como nombre de archivo
          );
          tool.imageUrl = uploadedImage.url;
        }

        // 3. Actualizamos los campos de texto si vienen en el DTO
        if (updateDto.idInventary !== undefined)
          tool.idInventary = updateDto.idInventary;
        if (updateDto.name !== undefined) tool.name = updateDto.name;
        if (updateDto.description !== undefined)
          tool.description = updateDto.description!;

        // 4. Actualizamos las relaciones de forma segura (y tipada)
        if (updateDto.modelId) {
          tool.model = { id: updateDto.modelId } as ToolsModel;
        }
        if (updateDto.statusId) {
          tool.toolStatus = { id: updateDto.statusId } as ToolsStatus;
        }
        if (updateDto.typeId) {
          tool.toolType = { id: updateDto.typeId } as ToolsType;
        }
        // Si invoiceId viene como null o string vacío, rompemos la relación, si viene un UUID la creamos
        if (updateDto.invoiceId !== undefined) {
          tool.invoice = updateDto.invoiceId
            ? ({ id: updateDto.invoiceId } as ToolsInvoice)
            : null;
        }

        // 5. Guardamos los cambios (TypeORM ejecutará un UPDATE en la base de datos)
        return await transactionManager.save(tool);
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

  private handleDBExeptions(error: any): never {
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
