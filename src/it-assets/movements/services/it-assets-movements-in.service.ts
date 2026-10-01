import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateItAssetsMovementsInDto } from '../dto/create-it-assets-movements-in.dto';
import { DataSource } from 'typeorm';
import {
  ItAssetsMovement,
  MovementType,
} from '../entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets/status/entities/it-assets-status.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsMovementsInService {
  private readonly logger = new Logger('ItAssetsMovementsInService');
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(createInDto: CreateItAssetsMovementsInDto) {
    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const asset = await transactionManager.findOne(ItAsset, {
          where: { id: createInDto.itAssetId },
        });

        if (!asset) {
          throw new BadRequestException(
            this.i18n.t('errors.itAssets.movementsIn.assetNotFound'),
          );
        }

        if (!asset.inUse) {
          throw new ConflictException(
            this.i18n.t('errors.itAssets.movementsIn.alreadyInInventory'),
          );
        }

        asset.itAssetStatus = {
          id: createInDto.itAssetsStatusId,
        } as ItAssetsStatus;
        asset.inUse = false;

        await transactionManager.save(ItAsset, asset);

        const newInMovement = transactionManager.create(ItAssetsMovement, {
          type: MovementType.IN,
          itAsset: asset,
          movementIn: {
            itAssetsStatus: { id: createInDto.itAssetsStatusId },
            observations: createInDto.observations,
          },
        });

        return await transactionManager.save(ItAssetsMovement, newInMovement);
      });
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  findOne(id: string) {
    try {
      return this.dataSource.transaction(async (transactionManager) => {
        const movement = await transactionManager.findOne(ItAssetsMovement, {
          where: { id },
        });
        if (!movement) {
          throw new NotFoundException(
            this.i18n.t('errors.itAssets.movementsIn.notFound'),
          );
        }
        return movement;
      });
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(error);
    if (dbError.code === '23505') {
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(itAssetStatusId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.movementsIn.statusNotFound'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
