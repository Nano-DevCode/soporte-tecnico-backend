import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlaStatus } from '../entities/ticket-sla.entity';

export class SlaTicketItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  ticketId!: string;

  @ApiProperty({ example: 'DIR-20261-0001' })
  folio!: string;

  @ApiProperty({ example: 1 })
  priority!: number;

  @ApiProperty({ example: 'Crítica' })
  priorityLabel!: string;

  @ApiProperty({ example: 'ATENDIENDO' })
  status!: string;

  @ApiProperty({ example: 'Sistemas y Computación' })
  departmentName!: string;

  @ApiProperty({ example: 12.0 })
  maxResolutionHours!: number;

  @ApiProperty({ example: 8.5 })
  elapsedHours!: number;

  @ApiProperty({ example: 3.5 })
  remainingHours!: number;

  @ApiProperty({ example: 70.83 })
  percentageConsumed!: number;

  @ApiProperty({ enum: SlaStatus, example: SlaStatus.ON_TRACK })
  slaStatus!: SlaStatus;

  @ApiPropertyOptional({ example: 'Carlos Mendoza' })
  coordinatorName?: string;

  @ApiPropertyOptional({ example: ['Juan Pérez', 'Pedro Gómez'] })
  technicians?: string[];

  @ApiProperty({ example: '2026-09-30T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-30T22:00:00.000Z' })
  resolutionDeadline!: string;
}

export class EvaluateSlaResponseDto {
  @ApiProperty({
    example: 30,
    description: 'Total de tickets activos evaluados',
  })
  checked!: number;

  @ApiProperty({ example: 22, description: 'Tickets dentro de plazo (<75%)' })
  onTrack!: number;

  @ApiProperty({ example: 5, description: 'Tickets en riesgo (75% a 100%)' })
  atRisk!: number;

  @ApiProperty({ example: 3, description: 'Tickets con SLA violado (>100%)' })
  breached!: number;

  @ApiProperty({
    example: 2,
    description: 'Alertas preventivas de riesgo emitidas en este ciclo',
  })
  warningAlertsSent!: number;

  @ApiProperty({
    example: 1,
    description: 'Alertas críticas de violación emitidas en este ciclo',
  })
  breachAlertsSent!: number;
}
