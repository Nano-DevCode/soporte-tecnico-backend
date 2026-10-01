import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { SlaStatus } from '../entities/ticket-sla.entity';

export class SlaTicketFilterDto extends PaginationWithPageDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por estado del SLA (ON_TRACK, AT_RISK, BREACHED, COMPLIANT)',
    enum: SlaStatus,
  })
  @IsOptional()
  @IsEnum(SlaStatus)
  status?: SlaStatus;

  @ApiPropertyOptional({
    description:
      'Filtrar por nivel de prioridad del ticket (1 = Crítica, 4 = Baja)',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  priority?: number;
}
