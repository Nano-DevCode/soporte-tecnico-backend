import { Controller, Get, Query, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { FilesService } from 'src/files/files.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { FilterTicketReportsDto } from 'src/tickets/dto/filter-ticket-reports.dto';
import { TicketsService } from '../tickets/services/tickets.service';
import express from 'express';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiProduces,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { SurveyService } from 'src/survey/survey.service';

@ApiTags('Excel Reports')
@ApiCookieAuth()
@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly filesService: FilesService,
    private readonly ticketsService: TicketsService,
    private readonly surveyService: SurveyService,
  ) {}

  @Get('tickets-summary')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Descargar reporte estadístico de tickets en Excel',
    description:
      'Genera y descarga un archivo Excel (.xlsx) con la matriz estadística de tickets filtrada por departamento y tipo de problema.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'Archivo Excel generado y descargado correctamente.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async downloadSummaryReport(
    @Query() filterTicketReportsDto: FilterTicketReportsDto,
    @Res() res: express.Response,
  ) {
    const reportData = await this.ticketsService.getTicketsSummaryReport(
      filterTicketReportsDto,
    );

    const config = {
      title: 'Estadísticas por Departamento y Tipo de Problema',
      sheetName: 'Estadísticas',
      issueTypes: reportData.issueTypes,
      data: reportData.data,
      totalsRow: reportData.totalsRow,
    };

    const workbook = this.excelService.generateTicketsMatrixReport(config);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Matriz_Tickets_${new Date().getTime()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('surveys-report')
  @Auth(ValidRole.superAdmin, ValidRole.coordinador, ValidRole.jefecc)
  @ApiOperation({
    summary: 'Descargar reporte de encuestas de satisfacción en Excel',
    description:
      'Genera y descarga un archivo Excel (.xlsx) con el historial de calificaciones y comentarios de satisfacción de los tickets cerrados.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'Archivo Excel generado y descargado correctamente.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async downloadSurveysReport(
    @Query() filterDto: FilterTicketReportsDto,
    @Res() res: express.Response,
  ) {
    const reportData =
      await this.surveyService.getSurveysExcelReport(filterDto);

    const config = {
      title: 'Reporte de Satisfacción del Servicio',
      sheetName: 'Satisfacción',
      columns: reportData.columns,
      data: reportData.data,
      overallAverage: reportData.overallAverage,
    };

    const workbook = this.excelService.generateSurveyReport(config);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_Satisfaccion_${new Date().getTime()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
