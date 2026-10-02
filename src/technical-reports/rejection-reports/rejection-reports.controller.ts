import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { RejectionReportsService } from './rejection-reports.service';
import { CreateRejectionReportDto } from './dto/create-rejection-report.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import {
  ApiTags,
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@UseFilters(DbexceptionFilter)
@ApiTags('Rejection Reports')
@ApiCookieAuth('Cookie')
@Controller('rejection-reports')
export class RejectionReportsController {
  constructor(
    private readonly rejectionReportsService: RejectionReportsService,
  ) {}

  @Post()
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  @ApiOperation({ summary: 'Crear un nuevo reporte de rechazo' })
  @ApiCreatedResponse({
    description: 'El reporte de rechazo ha sido creado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description:
      'No tiene los roles necesarios (superAdmin, Jefe CC, Coordinador).',
  })
  create(@Body() createRejectionReportDto: CreateRejectionReportDto) {
    return this.rejectionReportsService.create(createRejectionReportDto);
  }
}
