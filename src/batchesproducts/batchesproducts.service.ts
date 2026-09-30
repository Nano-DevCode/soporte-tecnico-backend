import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Batchesproduct } from './entities/batchesproduct.entity';
import { Consumable } from 'src/consumables/entities/consumable.entity';
import { ConsumableMovement } from 'src/consumable-movements/entities/consumable-movement.entity';
import { MovementType } from 'src/movement_types/entities/movement_type.entity';
import { MovementAplication } from 'src/movement_aplications/entities/movement_aplication.entity';
import { Department } from 'src/departments/entities/department.entity';
import { CreateBatchesproductDto } from './dto/create-batchesproduct.dto';
import { FilterBatchesproductDto } from './dto/filter-batchesproduct.dto';

@Injectable()
export class BatchesproductsService {
  private readonly logger = new Logger(BatchesproductsService.name);

  constructor(
    @InjectRepository(Batchesproduct)
    private readonly batchRepository: Repository<Batchesproduct>,
    @InjectRepository(Consumable)
    private readonly consumableRepository: Repository<Consumable>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(createDto: CreateBatchesproductDto) {
    const { num_requirement, items } = createDto;
    const cleanedRequirement = this.cleanString(num_requirement);

    // 1. VALIDACIÓN GLOBAL ANTES DEL BUCLE (Evita duplicados en exhibiciones distintas)
    const globalExistingBatch = await this.batchRepository.findOne({
      where: { num_requirement: cleanedRequirement },
    });

    if (globalExistingBatch) {
      throw new ConflictException(
        this.i18n.t('errors.batchesproducts.requirementAlreadyExists'),
      );
    }

    const appEntrance = await this.dataSource
      .getRepository(MovementAplication)
      .findOneBy({ id: 1 });
    if (!appEntrance) {
      throw new NotFoundException(
        this.i18n.t('errors.movementAplications.notFound', { args: { id: 1 } }),
      );
    }
    const prefix = this.cleanString(appEntrance.acronym).toUpperCase();

    const defaultDepartment = await this.dataSource
      .getRepository(Department)
      .findOneBy({
        name: 'Departamento de Centro de Cómputo',
      });
    if (!defaultDepartment) {
      throw new NotFoundException(
        this.i18n.t('errors.department.departmentNotFound', {
          args: { name: 'Departamento de Centro de Cómputo' },
        }),
      );
    }

    const lastMovement = await this.dataSource
      .getRepository(ConsumableMovement)
      .createQueryBuilder('m')
      .select(
        `MAX(CAST(SUBSTRING(UPPER(m.code_movement_aplication) FROM '${prefix}_#"([0-9]+)#"' FOR '#') AS INTEGER))`,
        'maxId',
      )
      .getRawOne<{ maxId: number | null }>();

    const nextId = (lastMovement?.maxId ?? 0) + 1;
    const code_movement_aplication = `${prefix}_${nextId}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedBatches: Batchesproduct[] = [];

      for (const item of items) {
        const { id_consumable, arrival_amount, cost_batch } = item;

        const consumable = await queryRunner.manager.findOne(Consumable, {
          where: { id: id_consumable },
          relations: ['id_unit_measurement'],
        });

        if (!consumable) {
          throw new NotFoundException(
            this.i18n.t('errors.consumables.consumableNotFound', {
              args: { id: id_consumable },
            }),
          );
        }

        const uses =
          consumable.number_uses && consumable.number_uses > 0
            ? consumable.number_uses
            : 1;
        const quantity_consumable = arrival_amount * uses;
        const available_stock = quantity_consumable;
        const cost_unit = Number((cost_batch / quantity_consumable).toFixed(4));

        const batch = queryRunner.manager.create(Batchesproduct, {
          id_consumable: consumable,
          num_requirement: cleanedRequirement,
          arrival_amount,
          quantity_consumable,
          available_stock,
          cost_batch,
          cost_unit,
        });
        const savedBatch = await queryRunner.manager.save(batch);
        savedBatches.push(savedBatch);

        const movement = queryRunner.manager.create(ConsumableMovement, {
          id_batches_product: savedBatch,
          id_movement_type: { id: 1 } as MovementType,
          id_movement_aplication: appEntrance,
          id_departament_consumable: defaultDepartment,
          code_movement_aplication,
          quantity_consumable: arrival_amount,
          observations: `Entrada de consumibles, requisición: ${cleanedRequirement}`,
          movement_cost: cost_batch,
        });

        await queryRunner.manager.save(movement);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Lotes registrados con éxito mediante bolsa de herramientas',
        code_movement_aplication,
        total_processed: savedBatches.length,
        batches: savedBatches,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filterDto: FilterBatchesproductDto) {
    const { limit = 10, offset = 0, query } = filterDto;
    const queryBuilder = this.batchRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.id_consumable', 'c')
      .take(limit)
      .skip(offset)
      .orderBy('b.created_at', 'DESC');

    if (query) {
      queryBuilder.where(
        "LOWER(CONCAT(b.num_requirement, ' ', c.description, ' ', c.item_code)) LIKE :query",
        { query: `%${query.toLowerCase()}%` },
      );
    }
    const [batches, total] = await queryBuilder.getManyAndCount();
    return {
      batches,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: ['id_consumable'],
    });
    if (!batch) {
      throw new NotFoundException(
        this.i18n.t('errors.batchesproducts.batchNotFound', { args: { id } }),
      );
    }
    return batch;
  }

  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  private handleDBExceptions(error: unknown): never {
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String((error as Record<string, unknown>).code);
      if (errorCode === '23505') {
        throw new ConflictException(
          this.i18n.t('errors.batchesproducts.requirementAlreadyExists'),
        );
      }
      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('errors.batchesproducts.foreignKeyViolation'),
        );
      }
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
