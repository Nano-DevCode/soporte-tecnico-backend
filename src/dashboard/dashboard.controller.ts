import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  costPerIncidentGoal,
  criticalAvailabilityGoal,
  firstLevelResolutionGoal,
  LimitResolutionTime,
  preventiveMaintanenceGoal,
  SLAComplianceGoal,
  userSatisfaccionGoal,
} from 'src/config/params.config';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiCookieAuth()
@UseFilters(DbexceptionFilter)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics/critical-availability')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener disponibilidad de servicios críticos' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el porcentaje de disponibilidad y si cumple con la meta establecida.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getCriticalAvailability(@Query() filters: DashboardFiltersDto) {
    const availabilityValue =
      await this.dashboardService.getCriticalServiceAvailability(filters);

    const isSuccess = availabilityValue >= criticalAvailabilityGoal;

    return {
      data: {
        success: isSuccess,
        value: availabilityValue,
        meta: criticalAvailabilityGoal,
      },
    };
  }

  @Get('mttr')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener tiempo medio de recuperación (MTTR)' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el MTTR actual y su comparación con el periodo anterior.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getMTTR(@Query() filters: DashboardFiltersDto) {
    const mttrData = await this.dashboardService.getMeanTimeToRecovery(filters);

    const isSuccess = mttrData.isImproved;

    return {
      data: {
        success: isSuccess,
        value: mttrData.currentMttr,
        comparison: {
          previousValue: mttrData.previousMttr,
          difference: mttrData.difference,
          isImproved: mttrData.isImproved,
        },
      },
    };
  }

  @Get('critical-interruptions')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener cantidad de interrupciones críticas por mes',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna los datos históricos de las interrupciones críticas agrupados por mes.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getCriticalInterruptions(@Query() filters: DashboardFiltersDto) {
    const data =
      await this.dashboardService.getCriticalInterruptionsPerMonth(filters);

    return {
      success: true,
      data,
    };
  }

  @Get('resolution-time-by-priority')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener tiempo promedio de resolución por prioridad',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna los tiempos promedios de resolución agrupados por la prioridad del ticket.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getResolutionTime(@Query() filters: DashboardFiltersDto) {
    const data =
      await this.dashboardService.getAverageResolutionTimeByPriority(filters);
    return {
      success: true,
      goals: LimitResolutionTime,
      data,
    };
  }

  @Get('first-level-resolution')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener porcentaje de resolución en el primer nivel',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el porcentaje de tickets resueltos en el primer nivel y los detalles de totales.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getFirstLevelResolution(@Query() filters: DashboardFiltersDto) {
    const metrics =
      await this.dashboardService.getFirstLevelResolution(filters);

    const isSuccess = metrics.percentage >= firstLevelResolutionGoal;

    return {
      data: {
        success: isSuccess,
        value: metrics.percentage,
        meta: firstLevelResolutionGoal,
        details: {
          totalResolved: metrics.totalResolved,
          firstLevelResolved: metrics.firstLevelResolved,
        },
      },
    };
  }

  @Get('sla-compliance')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener nivel de cumplimiento de SLA' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el porcentaje de tickets que cumplieron con el SLA establecido.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getSlaCompliance(@Query() filters: DashboardFiltersDto) {
    const metrics = await this.dashboardService.getSlaCompliance(filters);

    const isSuccess = metrics.percentage >= SLAComplianceGoal;

    return {
      data: {
        success: isSuccess,
        value: metrics.percentage,
        meta: SLAComplianceGoal,
        details: {
          totalResolved: metrics.totalResolved,
          slaMet: metrics.slaMet,
        },
      },
    };
  }

  @Get('preventive-maintenance-coverage')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener cobertura de mantenimiento preventivo' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna la métrica de cobertura de mantenimiento preventivo sobre el total de equipos.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getPreventiveMaintenanceCoverage(
    @Query() filters: DashboardFiltersDto,
  ) {
    const metrics =
      await this.dashboardService.getPreventiveMaintenanceCoverage(filters);

    const isSuccess = metrics.percentage >= preventiveMaintanenceGoal;

    return {
      data: {
        success: isSuccess,
        value: metrics.percentage,
        meta: preventiveMaintanenceGoal,
        details: {
          totalEquipment: metrics.totalEquipment,
          maintainedEquipment: metrics.maintainedEquipment,
        },
      },
    };
  }

  @Get('cost-per-incident')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener costo promedio por incidente' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el costo promedio asociado a cada ticket de incidente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getCostPerIncident(@Query() filters: DashboardFiltersDto) {
    const metrics = await this.dashboardService.getCostPerIncident(filters);

    const isSuccess = metrics.averageCost <= costPerIncidentGoal;

    return {
      data: {
        success: isSuccess,
        value: metrics.averageCost,
        meta: costPerIncidentGoal,
        details: {
          totalCost: metrics.totalCost,
          totalTickets: metrics.totalTickets,
        },
      },
    };
  }

  @Get('tickets-by-status')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener distribución de tickets por estado' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el conteo total de tickets divididos por su estado actual.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getTicketsByStatus(@Query() filters: DashboardFiltersDto) {
    const data = await this.dashboardService.getTicketsByStatus(filters);

    return {
      data: data,
    };
  }

  @Get('metrics/user-satisfaction')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener métricas de satisfacción del usuario (CSAT)',
    description:
      'Calcula el promedio general de las encuestas, el porcentaje CSAT (usuarios que calificaron con 4 o 5 estrellas) y el desglose de promedios por pregunta numérica.',
  })
  @ApiOkResponse({
    description:
      'Retorna los indicadores de satisfacción calculados y el desglose por preguntas.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getUserSatisfaction(@Query() filters: DashboardFiltersDto) {
    const metrics =
      await this.dashboardService.getUserSatisfactionMetrics(filters);

    const isSuccess = metrics.csatPercentage >= userSatisfaccionGoal;

    return {
      data: {
        success: isSuccess,
        value: metrics.csatPercentage,
        meta: userSatisfaccionGoal,
        details: {
          averageScore: metrics.averageScore,
          totalSurveys: metrics.totalSurveys,
          questionBreakdown: metrics.questionBreakdown,
        },
      },
    };
  }

  @Get('distribution/tickets-by-department')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({ summary: 'Obtener distribución de tickets por departamento' })
  @ApiOkResponse({ description: 'Conteo por departamento obtenido con éxito.' })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getTicketsByDepartment(@Query() filters: DashboardFiltersDto) {
    return await this.dashboardService.getTicketsByDepartmentMetrics(filters);
  }

  @Get('distribution/tickets-by-issue-type')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener distribución de tickets por tipo de problema',
  })
  @ApiOkResponse({
    description: 'Conteo por tipo de incidencia obtenido con éxito.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getTicketsByIssueType(@Query() filters: DashboardFiltersDto) {
    return await this.dashboardService.getTicketsByIssueTypeMetrics(filters);
  }
}
