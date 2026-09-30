import { Injectable, NotFoundException } from '@nestjs/common';
import { ToolsMovement } from './entities/tools-movement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { FilterToolsMovementsDto } from './dto/filter-tools-movements.dto';

@Injectable()
export class ToolsMovementsService {
  constructor(
    @InjectRepository(ToolsMovement)
    private readonly toolsMovementRepository: Repository<ToolsMovement>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(filterDto: FilterToolsMovementsDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      type,
      startDate,
      endDate,
    } = filterDto;

    const queryBuilder =
      this.toolsMovementRepository.createQueryBuilder('toolsMovement');

    queryBuilder.leftJoinAndSelect('toolsMovement.tool', 'tool');
    queryBuilder.leftJoinAndSelect('toolsMovement.movementIn', 'movementIn');
    queryBuilder.leftJoinAndSelect('toolsMovement.movementOut', 'movementOut');

    // 1. Filtro por ID, idInventary o serialNumber
    if (query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('CAST(toolsMovement.id AS text) = :query', { query })
            .orWhere('LOWER(toolsMovement.idInventary) LIKE LOWER(:termLike)', {
              termLike: `%${query}%`,
            })
            // Aquí ya usabas 'tool', así que ahora funcionará correctamente
            .orWhere('LOWER(tool.serialNumber) LIKE LOWER(:termLike)', {
              termLike: `%${query}%`,
            });
        }),
      );
    }

    if (type) {
      queryBuilder.andWhere('toolsMovement.type = :type', { type });
    }

    if (startDate) {
      queryBuilder.andWhere(
        'CAST(toolsMovement.createdAt AS DATE) >= :startDate',
        {
          startDate,
        },
      );
    }

    if (endDate) {
      queryBuilder.andWhere(
        'CAST(toolsMovement.createdAt AS DATE) <= :endDate',
        {
          endDate,
        },
      );
    }

    queryBuilder.orderBy('toolsMovement.createdAt', 'DESC');
    queryBuilder.take(limit).skip(offset);
    const [toolsMovements, total] = await queryBuilder.getManyAndCount();

    return {
      toolsMovements,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const movement = await this.toolsMovementRepository.findOne({
      where: { id },
      relations: {
        movementIn: true,
        movementOut: {
          staff: true,
          ticket: true,
          toolStatus: true,
        },
        tool: {
          toolType: true,
          toolStatus: true,
          invoice: true,
          model: {
            brand: true,
          },
        },
      },
    });

    // Buena práctica: Si no existe, lanzamos un error 404
    if (!movement) {
      throw new NotFoundException(
        this.i18n.t('errors.tools.movements.notFoundWithId', { args: { id } }),
      );
    }

    return movement;
  }
}
