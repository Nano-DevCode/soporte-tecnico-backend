import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { SlaMonitorService } from './services/sla-monitor.service';
import { SlaMetricsResponseDto } from './dto/sla-metrics-response.dto';
import { SlaTicketFilterDto } from './dto/sla-ticket-filter.dto';
import { EvaluateSlaResponseDto } from './dto/sla-ticket-item-response.dto';

@ApiTags('SLA - Acuerdos de Nivel de Servicio')
@ApiBearerAuth()
@Controller('sla')
export class SlaController {
  constructor(private readonly slaMonitorService: SlaMonitorService) {}

  @Get('metrics')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Métricas de SLA en tiempo real',
    description:
      'Retorna el estado de cumplimiento general de los tickets activos, conteo en riesgo, vencidos y desglose por prioridad.',
  })
  @ApiResponse({ status: 200, type: SlaMetricsResponseDto })
  async getMetrics(): Promise<SlaMetricsResponseDto> {
    return this.slaMonitorService.getMetrics();
  }

  @Get('tickets')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
  )
  @ApiOperation({
    summary: 'Listado de tickets con seguimiento de SLA',
    description:
      'Retorna los tickets activos paginados con sus horas consumidas, horas restantes, porcentaje y estatus de SLA.',
  })
  async getTickets(@Query() filterDto: SlaTicketFilterDto) {
    return this.slaMonitorService.getActiveTicketsWithSla(filterDto);
  }

  @Post('evaluate')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Ejecutar ciclo de evaluación de SLA bajo demanda',
    description:
      'Dispara la verificación manual de todos los tickets activos, calcula riesgos y despacha alertas por Telegram / WebSocket.',
  })
  @ApiResponse({ status: 200, type: EvaluateSlaResponseDto })
  async evaluateNow(): Promise<EvaluateSlaResponseDto> {
    return this.slaMonitorService.runSlaCheck();
  }
}
