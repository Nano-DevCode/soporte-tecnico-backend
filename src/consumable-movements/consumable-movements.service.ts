import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { ConsumableMovement } from './entities/consumable-movement.entity';
import { Batchesproduct } from 'src/batchesproducts/entities/batchesproduct.entity';
import { MovementType } from 'src/movement_types/entities/movement_type.entity';
import { MovementAplication } from 'src/movement_aplications/entities/movement_aplication.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { CreateConsumableMovementDto } from './dto/create-consumable-movement.dto';
import { FilterConsumablemovementDto } from './dto/filter-consumable-movement.dto';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class ConsumableMovementsService {
  private readonly logger = new Logger(ConsumableMovementsService.name);

  constructor(
    @InjectRepository(ConsumableMovement)
    private readonly movementRepository: Repository<ConsumableMovement>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * REGISTRAR SALIDAS DE CONSUMIBLES EN MASA (SOPORTE PARA CARRITO / BOLSA)
   * APLICA EL ALGORITMO PEPS DE FORMA ATÓMICA
   */
  async registerOutput(createDto: CreateConsumableMovementDto) {
    const {
      id_movement_aplication,
      id_departament_consumable,
      id_ticket,
      observations,
      items,
    } = createDto;

    if (!items || items.length === 0) {
      throw new BadRequestException(
        this.i18n.t('errors.consumableMovements.emptyCart'),
      );
    }

    let dbTicket: Ticket | null = null;
    if (id_movement_aplication === 2) {
      if (!id_ticket) {
        throw new BadRequestException(
          this.i18n.t('errors.consumableMovements.requiredTicket'),
        );
      }
      dbTicket = await this.ticketRepository.findOne({
        where: { id: id_ticket },
      });
      if (!dbTicket) {
        throw new NotFoundException(
          this.i18n.t('errors.consumableMovements.ticketNotFound', {
            args: { id: id_ticket },
          }),
        );
      }
    }

    if (
      id_movement_aplication !== 2 &&
      (!observations || observations.trim() === '')
    ) {
      throw new BadRequestException(
        this.i18n.t('errors.consumableMovements.requiredObservations'),
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentAplication = await queryRunner.manager.findOneBy(
        MovementAplication,
        { id: id_movement_aplication },
      );
      if (!currentAplication) {
        throw new NotFoundException(
          this.i18n.t('errors.movementAplications.notFound', {
            args: { id: id_movement_aplication },
          }),
        );
      }

      const prefix = this.cleanString(currentAplication.acronym).toUpperCase();
      let code_movement_aplication = '';

      if (id_movement_aplication === 2 && dbTicket) {
        code_movement_aplication = `${prefix}_${dbTicket.folio}`;
      } else {
        const lastSerial = await queryRunner.manager
          .createQueryBuilder(ConsumableMovement, 'm')
          .select(
            `MAX(CAST(SUBSTRING(UPPER(m.code_movement_aplication) FROM '${prefix}_#"([0-9]+)#"' FOR '#') AS INTEGER))`,
            'maxId',
          )
          .getRawOne<{ maxId: number | null }>();

        const nextSerialId = (lastSerial?.maxId ?? 0) + 1;
        code_movement_aplication = `${prefix}_${nextSerialId}`;
      }

      const totalMovementsCreated: ConsumableMovement[] = [];

      for (const item of items) {
        const { id_consumable, quantity_consumable } = item;

        const activeBatches = await queryRunner.manager.find(Batchesproduct, {
          where: { id_consumable: { id: id_consumable } },
          relations: ['id_consumable'],
          order: { created_at: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });

        const availableBatches = activeBatches.filter(
          (b) => b.available_stock > 0,
        );

        const totalStock = availableBatches.reduce(
          (acc, b) => acc + b.available_stock,
          0,
        );

        if (totalStock < quantity_consumable) {
          const productName = activeBatches[0]?.id_consumable?.name;
          throw new BadRequestException(
            this.i18n.t('errors.consumableMovements.insufficientStock', {
              args: {
                product: productName,
                requested: String(quantity_consumable),
                available: String(totalStock),
              },
            }),
          );
        }

        let remainingToConsume = quantity_consumable;

        for (const batch of availableBatches) {
          if (remainingToConsume <= 0) break;

          let quantityTaken = 0;
          if (batch.available_stock >= remainingToConsume) {
            quantityTaken = remainingToConsume;
            batch.available_stock -= remainingToConsume;
            remainingToConsume = 0;
          } else {
            quantityTaken = batch.available_stock;
            remainingToConsume -= batch.available_stock;
            batch.available_stock = 0;
          }

          const movement_cost = Number(
            (quantityTaken * batch.cost_unit).toFixed(4),
          );

          await queryRunner.manager.save(Batchesproduct, batch);

          const movement = queryRunner.manager.create(ConsumableMovement, {
            id_batches_product: { id: batch.id } as DeepPartial<Batchesproduct>,
            id_movement_type: { id: 2 } as DeepPartial<MovementType>,
            id_movement_aplication: {
              id: id_movement_aplication,
            } as DeepPartial<MovementAplication>,
            id_ticket: dbTicket ? { id: dbTicket.id } : undefined,
            code_movement_aplication,
            id_departament_consumable: {
              id: id_departament_consumable,
            } as DeepPartial<Department>,
            quantity_consumable: quantityTaken,
            observations: observations
              ? this.cleanString(observations)
              : `Consumo por el Ticket de Folio: ${dbTicket?.folio}`,
            movement_cost,
          });

          const savedMovement = await queryRunner.manager.save(
            ConsumableMovement,
            movement,
          );
          totalMovementsCreated.push(savedMovement);
        }
      }
      await queryRunner.commitTransaction();

      return {
        message: 'Lógica de Salida de consumibles fue aplicada con éxito',
        code_movement_aplication,
        total_items_processed: items.length,
        records_affected: totalMovementsCreated.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * OBTENER EL RESUMEN MONETARIO Y DESGLOSE COMPLETO POR CÓDIGO/FOLIO AGRUPADO
   */
  async findSummaryByCode(code: string) {
    const movements = await this.movementRepository.find({
      where: { code_movement_aplication: code },
      relations: [
        'id_batches_product',
        'id_batches_product.id_consumable',
        'id_departament_consumable',
        'id_movement_type',
        'id_movement_aplication',
        'id_ticket',
      ],
    });

    if (movements.length === 0) {
      throw new NotFoundException(
        this.i18n.t('errors.consumableMovements.movementNotFound', {
          args: { code },
        }),
      );
    }

    const totalQuantity = movements.reduce(
      (sum, m) => sum + m.quantity_consumable,
      0,
    );
    const rawTotalCost = movements.reduce(
      (sum, m) => sum + Number(m.movement_cost),
      0,
    );

    return {
      code_movement_aplication: code,
      created_at:
        movements[0].created_at instanceof Date
          ? movements[0].created_at.toISOString().slice(0, 19)
          : String(movements[0].created_at).slice(0, 19),
      movement_type: movements[0].id_movement_type,
      movement_aplication: movements[0].id_movement_aplication,
      department: movements[0].id_departament_consumable,
      ticket: movements[0].id_ticket,
      observations: movements[0].observations,
      total_quantity: totalQuantity,
      total_cost: Number(rawTotalCost.toFixed(4)),
      subItems: movements.map((m) => ({
        id: m.id,
        quantity_consumable: m.quantity_consumable,
        movement_cost: Number(m.movement_cost),
        observations: m.observations,
        batch: {
          id: m.id_batches_product?.id,
          num_requirement: m.id_batches_product?.num_requirement,
          cost_unit: m.id_batches_product?.cost_unit,
        },
        consumable: m.id_batches_product?.id_consumable ?? null,
      })),
    };
  }

  /**
   * LISTAR TODOS LOS MOVIMIENTOS AGRUPADOS Y PAGINADOS SIN PÉRDIDA DE SUB-ITEMS
   */
  async findAll(filterDto: FilterConsumablemovementDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      id_movement_type,
      id_movement_aplication,
      id_departament_consumable,
      startDate,
      endDate,
    } = filterDto;

    const codeQueryBuilder = this.movementRepository
      .createQueryBuilder('m')
      .select('m.code_movement_aplication', 'code')
      .addSelect('MAX(m.created_at)', 'max_created_at')
      .leftJoin('m.id_batches_product', 'b')
      .leftJoin('b.id_consumable', 'c')
      .leftJoin('m.id_movement_type', 'mt')
      .leftJoin('m.id_movement_aplication', 'ma')
      .leftJoin('m.id_departament_consumable', 'd')
      .groupBy('m.code_movement_aplication')
      .orderBy('max_created_at', 'DESC');

    if (query) {
      const sanitizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase();
      codeQueryBuilder.andWhere(
        '(LOWER(m.code_movement_aplication) LIKE :query OR LOWER(m.observations) LIKE :query OR LOWER(c.description) LIKE :query)',
        { query: `%${sanitizedQuery}%` },
      );
    }

    if (id_movement_type) {
      codeQueryBuilder.andWhere('mt.id = :id_movement_type', {
        id_movement_type,
      });
    }

    if (id_movement_aplication) {
      codeQueryBuilder.andWhere('ma.id = :id_movement_aplication', {
        id_movement_aplication,
      });
    }

    if (id_departament_consumable) {
      codeQueryBuilder.andWhere('d.id = :id_departament_consumable', {
        id_departament_consumable,
      });
    }

    const formatDateParam = (value: string | Date) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : value;

    if (startDate) {
      const localStart = new Date(`${formatDateParam(startDate)}T00:00:00`);
      const utcStart = new Date(localStart.getTime());
      codeQueryBuilder.andWhere('m.created_at >= :startDate', {
        startDate: utcStart,
      });
    }

    if (endDate) {
      const localEnd = new Date(`${formatDateParam(endDate)}T23:59:59`);
      const utcEnd = new Date(localEnd.getTime());

      codeQueryBuilder.andWhere('m.created_at <= :endDate', {
        endDate: utcEnd,
      });
    }

    const rawCodesTotal = await codeQueryBuilder.getRawMany<{ code: string }>();
    const totalFoliosCount = rawCodesTotal.length;

    const paginatedCodesRaw = await codeQueryBuilder
      .limit(Number(limit))
      .offset(Number(offset))
      .getRawMany<{ code: string }>();

    const targetCodes = paginatedCodesRaw
      .map((item) => item.code)
      .filter(Boolean);

    if (targetCodes.length === 0) {
      return {
        movements: [],
        meta: {
          total: 0,
          page: Math.floor(offset / limit) + 1,
          lastPage: 1,
        },
      };
    }
    const fullMovements = await this.movementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.id_batches_product', 'b')
      .leftJoinAndSelect('b.id_consumable', 'c')
      .leftJoinAndSelect('m.id_movement_type', 'mt')
      .leftJoinAndSelect('m.id_movement_aplication', 'ma')
      .leftJoinAndSelect('m.id_departament_consumable', 'd')
      .leftJoinAndSelect('m.id_ticket', 't')
      .where('m.code_movement_aplication IN (:...targetCodes)', { targetCodes })
      .orderBy('m.created_at', 'DESC')
      .getMany();

    const groupedMap: Record<
      string,
      {
        code_movement_aplication: string;
        created_at: string;
        movement_type: unknown;
        movement_aplication: unknown;
        department: unknown;
        ticket: unknown;
        observations: string | null;
        total_quantity: number;
        total_cost: number;
        subItems: any[];
      }
    > = {};

    fullMovements.forEach((item) => {
      const code = item.code_movement_aplication;
      const cost = Number(item.movement_cost || 0);
      const quantity = Number(item.quantity_consumable || 0);

      const rawDate =
        item.created_at instanceof Date
          ? item.created_at.toISOString()
          : String(item.created_at);
      const formattedDate = rawDate.slice(0, 19);

      if (!groupedMap[code]) {
        groupedMap[code] = {
          code_movement_aplication: code,
          created_at: formattedDate,
          movement_type: item.id_movement_type,
          movement_aplication: item.id_movement_aplication,
          department: item.id_departament_consumable,
          ticket: item.id_ticket,
          observations: item.observations,
          total_quantity: 0,
          total_cost: 0,
          subItems: [],
        };
      }

      groupedMap[code].total_quantity += quantity;
      groupedMap[code].total_cost = Number(
        (groupedMap[code].total_cost + cost).toFixed(4),
      );
      groupedMap[code].subItems.push({
        id: item.id,
        quantity_consumable: quantity,
        movement_cost: cost,
        observations: item.observations,
        batch: {
          id: item.id_batches_product?.id,
          num_requirement: item.id_batches_product?.num_requirement,
          cost_unit: item.id_batches_product?.cost_unit,
        },
        consumable: item.id_batches_product?.id_consumable ?? null,
      });
    });

    const orderedGroupedMovements = targetCodes
      .map((code) => groupedMap[code])
      .filter(Boolean);

    return {
      movements: orderedGroupedMovements,
      meta: {
        total: totalFoliosCount,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.max(1, Math.ceil(totalFoliosCount / limit)),
      },
    };
  }

  async findOneMovement(id: number | string) {
    const movement = await this.movementRepository.findOne({
      where: { id: String(id) },
      relations: [
        'id_batches_product',
        'id_batches_product.id_consumable',
        'id_movement_type',
        'id_movement_aplication',
        'id_departament_consumable',
        'id_ticket',
      ],
    });

    if (!movement) {
      throw new NotFoundException(
        this.i18n.t('errors.consumableMovements.movementNotFound', {
          args: { id },
        }),
      );
    }

    return movement;
  }

  private cleanString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  private handleDBExceptions(error: unknown): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String((error as Record<string, unknown>).code);

      if (errorCode === '23503') {
        throw new BadRequestException(
          this.i18n.t('errors.consumableMovements.foreignKeyViolation'),
        );
      }
    }

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
