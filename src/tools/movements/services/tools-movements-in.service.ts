import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateToolsMovementsInDto } from '../dto/create-tools-movements-in.dto';
import { DataSource } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { Tool } from 'src/tools/entities/tool.entity';
import { ToolsStatus } from 'src/tools/status/entities/tools-status.entity';
import { MovementType, ToolsMovement } from '../entities/tools-movement.entity';

@Injectable()
export class ToolsMovementsInService {
  private readonly logger = new Logger('ToolsMovementsInService');
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(createInDto: CreateToolsMovementsInDto) {
    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const tool = await transactionManager.findOne(Tool, {
          where: { id: createInDto.toolId },
        });

        if (!tool) {
          throw new BadRequestException(
            this.i18n.t('errors.tools.movementsIn.toolNotFound'),
          );
        }

        if (!tool.inUse) {
          throw new ConflictException(
            this.i18n.t('errors.tools.movementsIn.alreadyInInventory'),
          );
        }

        tool.toolStatus = {
          id: createInDto.toolsStatusId,
        } as ToolsStatus;
        tool.inUse = false;

        await transactionManager.save(Tool, tool);

        const newInMovement = transactionManager.create(ToolsMovement, {
          type: MovementType.IN,
          tool: tool,
          movementIn: {
            toolsStatus: { id: createInDto.toolsStatusId } as ToolsStatus,
            observations: createInDto.observations,
          },
        });

        return await transactionManager.save(ToolsMovement, newInMovement);
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(error);
    if (dbError.code === '23505') {
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      if (dbError.detail?.includes('(toolsStatusId)=')) {
        throw new ConflictException(this.i18n.t('errors.tools.statusNotFound'));
      }
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
