import { ApiProperty } from '@nestjs/swagger';

export class SlaPriorityBreakdownDto {
  @ApiProperty({ example: 1 })
  priority!: number;

  @ApiProperty({ example: 'Crítica' })
  label!: string;

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 2 })
  onTrack!: number;

  @ApiProperty({ example: 1 })
  atRisk!: number;

  @ApiProperty({ example: 0 })
  breached!: number;
}

export class SlaMetricsResponseDto {
  @ApiProperty({
    example: 25,
    description: 'Total de tickets activos en evaluación de SLA',
  })
  totalActive!: number;

  @ApiProperty({
    example: 18,
    description: 'Tickets dentro de los límites de SLA (<75% consumido)',
  })
  onTrack!: number;

  @ApiProperty({
    example: 5,
    description: 'Tickets en riesgo de vencimiento (75% a 100% consumido)',
  })
  atRisk!: number;

  @ApiProperty({
    example: 2,
    description: 'Tickets que han violado el SLA (>100% consumido)',
  })
  breached!: number;

  @ApiProperty({
    example: 92.0,
    description: 'Porcentaje actual de cumplimiento de SLA en tickets activos',
  })
  compliancePercentage!: number;

  @ApiProperty({
    type: [SlaPriorityBreakdownDto],
    description: 'Desglose de métricas por nivel de prioridad',
  })
  byPriority!: SlaPriorityBreakdownDto[];
}
