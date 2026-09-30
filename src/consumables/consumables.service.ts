import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Consumable } from './entities/consumable.entity';
import { Batchesproduct } from 'src/batchesproducts/entities/batchesproduct.entity';
import { Typeconsumable } from 'src/typeconsumables/entities/typeconsumable.entity';
import { UnitMeasurement } from 'src/unit-measurement/entities/unit-measurement.entity';
import { BrandConsumable } from 'src/brand-consumables/entities/brand-consumable.entity';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FilterConsumableDto } from './dto/filter-consumable.dto';
import { ConsumableUbication } from 'src/consumable_ubications/entities/consumable_ubication.entity';
// ... todos tus imports actuales se mantienen igual
import { FilesService, type MulterFile } from 'src/files/files.service'; // <-- AGREGADO
import { DataSource } from 'typeorm'; // <-- AGREGADO

@Injectable()
export class ConsumablesService {
  private readonly logger = new Logger(ConsumablesService.name);

  constructor(
    @InjectRepository(Consumable)
    private readonly consumableRepository: Repository<Consumable>,

    @InjectRepository(Batchesproduct)
    private readonly batchRepository: Repository<Batchesproduct>,

    @InjectRepository(Typeconsumable)
    private readonly typeConsumableRepository: Repository<Typeconsumable>,

    @InjectRepository(UnitMeasurement)
    private readonly unitMeasurementRepository: Repository<UnitMeasurement>,

    @InjectRepository(BrandConsumable)
    private readonly brandConsumableRepository: Repository<BrandConsumable>,

    @InjectRepository(ConsumableUbication)
    private readonly consumableUbicationRepository: Repository<ConsumableUbication>,

    private readonly i18n: I18nService,
    private readonly filesService: FilesService, // <-- AGREGADO
    private readonly dataSource: DataSource, // <-- AGREGADO
  ) {}

  // --- CREAR CONSUMIBLE CON IMAGEN ---
  public async create(
    createDto: CreateConsumableDto,
    file?: MulterFile,
  ): Promise<Consumable> {
    const name = this.cleanString(createDto.name);
    const description = this.cleanString(createDto.description);
    const stockMin = createDto.stockMin ?? 0;
    const stockMax = createDto.stockMax ?? 0;

    const brandId = String(createDto.id_brand_consumable);
    const brandExists = await this.brandConsumableRepository.findOneBy({
      id: brandId,
    });
    if (!brandExists)
      throw new NotFoundException(
        this.i18n.t('errors.brands_consumable.brandNotFound', {
          args: { id: brandId },
        }),
      );

    const typeExists = await this.typeConsumableRepository.findOneBy({
      id: Number(createDto.id_type_consumable),
    });
    if (!typeExists)
      throw new NotFoundException(
        this.i18n.t('errors.consumables.typeNotFound'),
      );

    const ubicationExists = await this.consumableUbicationRepository.findOneBy({
      id: String(createDto.id_ubication_consumable),
    });
    if (!ubicationExists)
      throw new NotFoundException(
        this.i18n.t('errors.consumables.ubicationNotFound'),
      );

    const unitExists = await this.unitMeasurementRepository.findOneBy({
      id: Number(createDto.id_unit_measurement),
    });
    if (!unitExists)
      throw new NotFoundException(
        this.i18n.t('errors.consumables.unitNotFound'),
      );

    const existingDescription = await this.consumableRepository.findOne({
      where: { description: ILike(description) },
    });
    if (existingDescription)
      throw new ConflictException(
        this.i18n.t('errors.consumables.descriptionExists'),
      );

    let finalNumberUses = 1;
    if (unitExists.id === 1) {
      if (
        !createDto.number_uses ||
        String(createDto.number_uses).trim() === ''
      ) {
        throw new BadRequestException(
          this.i18n.t('errors.consumables.missingNumberUses'),
        );
      }
      const parsedUses = parseInt(String(createDto.number_uses), 10);
      if (isNaN(parsedUses) || parsedUses <= 0)
        throw new BadRequestException(
          this.i18n.t('errors.consumables.invalidNumberUses'),
        );
      finalNumberUses = parsedUses;
    }

    // 7. Generación consecutiva automática del item_code
    const lastRecord = await this.consumableRepository
      .createQueryBuilder('c')
      .select(
        "MAX(CAST(SUBSTRING(c.item_code FROM 'ART_([0-9]+)') AS INTEGER))",
        'maxId',
      )
      .getRawOne<{ maxId: number | null }>();

    const nextId = (lastRecord?.maxId ?? 0) + 1;
    const item_code = `ART_${nextId}`;

    // --- NUEVA LÓGICA DE TRANSACCIÓN E IMAGEN ---
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Crear y guardar estructura base para obtener el ID real
        const consumableInstance = manager.create(Consumable, {
          item_code,
          name,
          description,
          stockMin,
          stockMax,
          id_ubication_consumable: ubicationExists,
          number_uses: finalNumberUses,
          id_brand_consumable: brandExists,
          id_type_consumable: typeExists,
          id_unit_measurement: unitExists,
        });

        let savedConsumable = await manager.save(consumableInstance);

        // 2. Subir imagen usando el ID del consumible
        if (file) {
          const uploadResult = await this.filesService.uploadFile(
            file,
            'images-consumable', // Nombre del nuevo bucket
            savedConsumable.id,
          );

          // 3. Modificar la URL en el registro y guardar definitivo
          savedConsumable.imageUrl = uploadResult.url;
          savedConsumable = await manager.save(savedConsumable);
        }
        return savedConsumable;
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- MODIFICAR CONSUMIBLE CON IMAGEN ---
  public async update(
    id: string,
    updateDto: UpdateConsumableDto,
    file?: MulterFile, // <-- AGREGADO
  ): Promise<Consumable> {
    const consumable = await this.consumableRepository.findOne({
      where: { id },
      relations: [
        'id_type_consumable',
        'id_unit_measurement',
        'id_brand_consumable',
        'id_ubication_consumable',
      ],
    });

    if (!consumable) {
      throw new NotFoundException(
        this.i18n.t('errors.consumables.consumableNotFound', { args: { id } }),
      );
    }

    const isChangingUnit =
      updateDto.id_unit_measurement !== undefined &&
      Number(updateDto.id_unit_measurement) !==
        consumable.id_unit_measurement?.id;
    const isChangingUses =
      updateDto.number_uses !== undefined &&
      Number(updateDto.number_uses) !== consumable.number_uses;

    if (isChangingUnit || isChangingUses) {
      const hasMovements = await this.batchRepository.findOne({
        where: { id_consumable: { id } },
      });
      if (hasMovements)
        throw new BadRequestException(
          this.i18n.t('errors.consumables.cannotModifyActiveConsumable'),
        );
    }

    if (updateDto.id_brand_consumable) {
      const brandId = String(updateDto.id_brand_consumable);
      const brandExists = await this.brandConsumableRepository.findOneBy({
        id: brandId,
      });
      if (!brandExists)
        throw new NotFoundException(
          this.i18n.t('errors.brands.brandNotFound', { args: { id: brandId } }),
        );
      consumable.id_brand_consumable = brandExists;
    }

    if (updateDto.id_type_consumable) {
      const typeExists = await this.typeConsumableRepository.findOneBy({
        id: Number(updateDto.id_type_consumable),
      });
      if (!typeExists)
        throw new NotFoundException(
          this.i18n.t('errors.consumables.typeNotFound'),
        );
      consumable.id_type_consumable = typeExists;
    }

    if (updateDto.id_ubication_consumable) {
      const ubicationExists =
        await this.consumableUbicationRepository.findOneBy({
          id: String(updateDto.id_ubication_consumable),
        });
      if (!ubicationExists)
        throw new NotFoundException(
          this.i18n.t('errors.consumables.ubicationNotFound'),
        );
      consumable.id_ubication_consumable = ubicationExists;
    }

    if (updateDto.id_unit_measurement) {
      const unitExists = await this.unitMeasurementRepository.findOneBy({
        id: Number(updateDto.id_unit_measurement),
      });
      if (!unitExists)
        throw new NotFoundException(
          this.i18n.t('errors.consumables.unitNotFound'),
        );
      consumable.id_unit_measurement = unitExists;
    }

    if (consumable.id_unit_measurement.id === 1) {
      const sentUses = updateDto.number_uses;
      if (!sentUses || String(sentUses).trim() === '')
        throw new BadRequestException(
          this.i18n.t('errors.consumables.missingNumberUses'),
        );
      const parsedUses = parseInt(String(sentUses), 10);
      if (isNaN(parsedUses) || parsedUses <= 0)
        throw new BadRequestException(
          this.i18n.t('errors.consumables.invalidNumberUses'),
        );
      consumable.number_uses = parsedUses;
    } else if (consumable.id_unit_measurement.id === 2) {
      consumable.number_uses = 1;
    }

    if (updateDto.description) {
      const cleanDesc = this.cleanString(updateDto.description);
      const descriptionConflict = await this.consumableRepository.findOne({
        where: { description: ILike(cleanDesc) },
      });
      if (descriptionConflict && descriptionConflict.id !== id) {
        throw new ConflictException(
          this.i18n.t('errors.consumables.descriptionExists'),
        );
      }
      consumable.description = cleanDesc;
    }

    if (updateDto.name) {
      const cleanName = this.cleanString(updateDto.name);
      consumable.name = cleanName;
    }

    if (updateDto.stockMin !== null) {
      consumable.stockMin = updateDto.stockMin ?? 0;
    }
    if (updateDto.stockMax !== null) {
      consumable.stockMax = updateDto.stockMax ?? 0;
    }
    // --- NUEVA LÓGICA DE ACTUALIZACIÓN CON TRANSACCIÓN ---
    try {
      return await this.dataSource.transaction(async (manager) => {
        if (file) {
          const uploadResult = await this.filesService.uploadFile(
            file,
            'images-consumable',
            id,
          );
          consumable.imageUrl = uploadResult.url;
        }
        return await manager.save(consumable);
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  public async findAll(filterDto: FilterConsumableDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      id_ubication_consumable,
      id_type_consumable,
      id_unit_measurement,
    } = filterDto;

    const queryBuilder = this.consumableRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.id_brand_consumable', 'b')
      .leftJoinAndSelect('c.id_type_consumable', 'tc')
      .leftJoinAndSelect('c.id_unit_measurement', 'um')
      .leftJoinAndSelect('c.id_ubication_consumable', 'u')
      .addSelect('c.created_at')
      .addSelect((subQuery) => {
        return subQuery
          .select('COALESCE(SUM(bp.available_stock), 0)', 'total_stock')
          .from('batchesproduct', 'bp')
          .where('bp.id_consumable = c.id');
      }, 'c_available_stock')
      .take(limit)
      .skip(offset)
      .orderBy('c.created_at', 'DESC')
      .addOrderBy('c.item_code', 'ASC');

    // --- FILTRO POR BÚSQUEDA GENERAL (QUERY) ---
    if (query) {
      queryBuilder.andWhere(
        "LOWER(CONCAT(c.item_code, ' ', c.name, ' ', b.name, ' ', c.description, ' ', u.name)) LIKE :query",
        { query: `%${query.toLowerCase()}%` },
      );
    }

    if (id_ubication_consumable) {
      queryBuilder.andWhere(
        'c.id_ubication_consumable = :id_ubication_consumable',
        {
          id_ubication_consumable,
        },
      );
    }

    if (id_type_consumable) {
      queryBuilder.andWhere('c.id_type_consumable = :id_type_consumable', {
        id_type_consumable,
      });
    }

    if (id_unit_measurement) {
      queryBuilder.andWhere('c.id_unit_measurement = :id_unit_measurement', {
        id_unit_measurement,
      });
    }

    // Usamos getRawAndEntities porque los campos virtuales inyectados no se mapean directo con getMany
    const rawAndEntities = await queryBuilder.getRawAndEntities();

    // Mapeamos el stock calculado dentro de cada objeto de entidad consumible
    const consumables = rawAndEntities.entities.map((consumable, index) => {
      const rawResult = rawAndEntities.raw[index] as
        | Record<string, unknown>
        | undefined;
      // Inyectamos dinámicamente la propiedad disponible para el Frontend
      const availableStock = Number(rawResult?.['c_available_stock'] ?? 0);
      return Object.assign(consumable, {
        available_stock: availableStock,
      });
    });

    const total = await queryBuilder.getCount();

    return {
      consumables,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  public async findOne(id: string): Promise<Consumable> {
    const queryBuilder = this.consumableRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.id_type_consumable', 'tc')
      .leftJoinAndSelect('c.id_unit_measurement', 'um')
      .leftJoinAndSelect('c.id_brand_consumable', 'b')
      .leftJoinAndSelect('c.id_ubication_consumable', 'u')
      .addSelect((subQuery) => {
        return subQuery
          .select('COALESCE(SUM(bp.available_stock), 0)', 'total_stock')
          .from('batchesproduct', 'bp')
          .where('bp.id_consumable = c.id');
      }, 'c_available_stock')
      .where('c.id = :id', { id });

    const rawAndEntity = await queryBuilder.getRawOne<{
      c_available_stock: string;
    }>();
    const entity = await queryBuilder.getOne();

    if (!entity) {
      throw new NotFoundException(
        this.i18n.t('errors.consumables.consumableNotFound', { args: { id } }),
      );
    }

    // Inyectamos el stock calculado en la entidad única
    const entityWithStock = Object.assign(entity, {
      available_stock: Number(rawAndEntity?.c_available_stock ?? 0),
    });

    return entityWithStock;
  }

  // --- ELIMINAR ---
  public async remove(id: string) {
    const consumable = await this.findOne(id);
    try {
      await this.consumableRepository.remove(consumable);
      return { id, deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  private handleDBExceptions(error: unknown): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String((error as Record<string, unknown>).code);

      if (errorCode === '23505') {
        throw new ConflictException(
          this.i18n.t('errors.consumables.consumableAlreadyExists'),
        );
      }

      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('validation.isMatches', {
            args: { property: 'consumable' },
          }),
        );
      }
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
