import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { AuditAction } from '../entities/audit-log.entity';

export class FilterAuditLogsDto {
  @ApiPropertyOptional({
    default: 10,
    description: 'Cantidad de registros a obtener',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({
    default: 0,
    description: 'Offset o desplazamiento para paginación',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Nombre de la entidad auditada (ej. Ticket, Department, User)',
  })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional({
    description: 'ID o UUID de la entidad específica',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Acción realizada (CREATE, UPDATE, DELETE)',
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'UUID del usuario que realizó la acción',
  })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
