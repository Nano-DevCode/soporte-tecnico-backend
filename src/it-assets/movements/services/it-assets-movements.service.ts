import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterItAssetsMovementsDto } from '../dto/filter-it-assets-movements.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItAssetsMovement } from '../entities/it-assets-movement.entity';
import { Brackets, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsMovementsService {
  constructor(
    @InjectRepository(ItAssetsMovement)
    private readonly itAssetsMovementRepository: Repository<ItAssetsMovement>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(filterDto: FilterItAssetsMovementsDto) {
    const {
      limit = 10,
      offset = 0,
      query,
      type,
      startDate,
      endDate,
    } = filterDto;

    const queryBuilder =
      this.itAssetsMovementRepository.createQueryBuilder('itAssetsMovement');

    queryBuilder.leftJoinAndSelect('itAssetsMovement.itAsset', 'itAsset');
    queryBuilder.leftJoinAndSelect('itAssetsMovement.movementIn', 'movementIn');
    queryBuilder.leftJoinAndSelect(
      'itAssetsMovement.movementOut',
      'movementOut',
    );

    if (query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('CAST(itAsset.id AS text) = :query', { query })
            .orWhere('LOWER(itAsset.idInventary) LIKE LOWER(:termLike)', {
              termLike: `%${query}%`,
            })
            .orWhere('LOWER(itAsset.serialNumber) LIKE LOWER(:termLike)', {
              termLike: `%${query}%`,
            });
        }),
      );
    }

    if (type) {
      queryBuilder.andWhere('itAssetsMovement.type = :type', { type });
    }

    if (startDate) {
      queryBuilder.andWhere(
        'CAST(itAssetsMovement.createdAt AS DATE) >= :startDate',
        {
          startDate,
        },
      );
    }

    if (endDate) {
      queryBuilder.andWhere(
        'CAST(itAssetsMovement.createdAt AS DATE) <= :endDate',
        {
          endDate,
        },
      );
    }

    queryBuilder.orderBy('itAssetsMovement.createdAt', 'DESC');
    queryBuilder.take(limit).skip(offset);

    const [itAssetsMovements, total] = await queryBuilder.getManyAndCount();

    return {
      itAssetsMovements,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const movement = await this.itAssetsMovementRepository.findOne({
      where: { id },
      relations: {
        movementIn: true,
        movementOut: {
          staff: true,
          ticket: true,
          itAssetsStatus: true,
        },
        itAsset: {
          itAssetsType: true,
          itAssetStatus: true,
        },
      },
    });

    if (!movement) {
      throw new NotFoundException(
        this.i18n.t('errors.itAssets.movements.notFound'),
      );
    }

    return movement;
  }
}
