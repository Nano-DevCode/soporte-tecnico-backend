import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsMovementsOutDto } from './dto/create-tools-movements-out.dto';
import { DataSource } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { Tool } from 'src/tools/entities/tool.entity';
import { ToolsStatus } from 'src/tools-status/entities/tools-status.entity';
import {
  MovementType,
  ToolsMovement,
} from 'src/tools-movements/entities/tools-movement.entity';
import { DatabaseError } from 'src/interfaces/DatabaseError';

@Injectable()
export class ToolsMovementsOutService {
  private readonly logger = new Logger('ToolsMovementsOutService');
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(createOutDto: CreateToolsMovementsOutDto) {
    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const tool = await transactionManager.findOne(Tool, {
          where: { id: createOutDto.toolId },
        });

        if (!tool) {
          throw new BadRequestException(
            this.i18n.t('tools.movementsOut.toolNotFound'),
          );
        }
        if (tool.inUse) {
          throw new ConflictException(
            this.i18n.t('tools.movementsOut.alreadyInUse'),
          );
        }

        tool.toolStatus = {
          id: createOutDto.toolStatusId,
        } as ToolsStatus;
        tool.inUse = true;

        await transactionManager.save(Tool, tool);

        const newOutMovement = transactionManager.create(ToolsMovement, {
          type: MovementType.OUT,
          tool: tool,
          movementOut: {
            toolStatus: { id: createOutDto.toolStatusId },
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

        return await transactionManager.save(ToolsMovement, newOutMovement);
      });
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  private handleDBExeptions(error: any): never {
    const dbError = error as DatabaseError;
    if (error instanceof HttpException) {
      throw error;
    }
    if (dbError.code === '23505') {
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(toolStatusId)=')) {
        throw new ConflictException(this.i18n.t('errors.tools.statusNotFound'));
      }
      if (dbError.detail?.includes('(staffId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.movementsOut.staffNotFound'),
        );
      }
      if (dbError.detail?.includes('(ticketId)=')) {
        throw new ConflictException(
          this.i18n.t('errors.tools.movementsOut.ticketNotFound'),
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
