import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateItAssetsMovementsOutDto } from './dto/create-it-assets-movements-out.dto';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  ItAssetsMovement,
  MovementType,
} from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { DataSource } from 'typeorm';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ItAssetsMovementsOutService {
  private readonly logger = new Logger('ItAssetsMovementsOutService');
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(createOutDto: CreateItAssetsMovementsOutDto) {
    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const asset = await transactionManager.findOne(ItAsset, {
          where: { id: createOutDto.itAssetId },
        });

        if (!asset) {
          throw new BadRequestException(
            this.i18n.t('itAssets.movementsOut.assetNotFound'),
          );
        }

        if (asset.inUse) {
          throw new ConflictException(
            this.i18n.t('itAssets.movementsOut.alreadyInUse'),
          );
        }
        asset.itAssetStatus = {
          id: createOutDto.itAssetsStatusId,
        } as ItAssetsStatus;
        asset.inUse = true;

        await transactionManager.save(ItAsset, asset);

        const newOutMovement = transactionManager.create(ItAssetsMovement, {
          type: MovementType.OUT,
          itAsset: asset,
          movementOut: {
            itAssetsStatus: { id: createOutDto.itAssetsStatusId },
            observations: createOutDto.observations,
            description: createOutDto.description,
            voucher: createOutDto.voucher,
            staff: createOutDto.staffId
              ? { id: createOutDto.staffId }
              : undefined,
            ticket: createOutDto.ticketId
              ? { id: createOutDto.ticketId }
              : undefined,
          },
        });

        return await transactionManager.save(ItAssetsMovement, newOutMovement);
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
    if (dbError.code === '23505') {
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(itAssetStatusId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.statusNotFound'),
        );
      }
      if (dbError.detail?.includes('(staffId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.movementsOut.staffNotFound'),
        );
      }
      if (dbError.detail?.includes('(ticketId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.itAssets.movementsOut.ticketNotFound'),
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
