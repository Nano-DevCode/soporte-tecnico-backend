import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TechnicalReportsService } from './technical-reports.service';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from './dto/update-technical-report.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Technical Reports')
@ApiCookieAuth()
@UseFilters(DbexceptionFilter)
@Controller('technical-reports')
export class TechnicalReportsController {
  constructor(
    private readonly technicalReportsService: TechnicalReportsService,
  ) {}

  @Post()
  @Auth(
    ValidRole.tecnico,
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.jefe,
  )
  @ApiOperation({ summary: 'Crear un nuevo informe técnico' })
  @ApiCreatedResponse({ description: 'Informe técnico creado exitosamente.' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({ description: 'No tiene los roles necesarios.' })
  create(@Body() createTechnicalReportDto: CreateTechnicalReportDto) {
    return this.technicalReportsService.create(createTechnicalReportDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Buscar en la base de conocimientos (Informes técnicos)',
  })
  @ApiOkResponse({
    description: 'Retorna la lista paginada de informes técnicos.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  findAll(@Query() paginationWithPageDto: PaginationWithPageDto) {
    return this.technicalReportsService.searchKnowledgeBase(
      paginationWithPageDto,
    );
  }
  @Auth()
  @ApiOperation({ summary: 'Obtener un informe técnico por ID' })
  @ApiParam({ name: 'id', description: 'UUID del informe técnico' })
  @ApiOkResponse({ description: 'Detalle del informe técnico obtenido.' })
  @ApiNotFoundResponse({ description: 'Informe técnico no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicalReportsService.findOneMapped(id);
  }

  @Patch(':id')
  @Auth(
    ValidRole.tecnico,
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.jefecc,
  )
  @ApiOperation({ summary: 'Actualizar un informe técnico existente' })
  @ApiParam({ name: 'id', description: 'UUID del informe técnico' })
  @ApiOkResponse({ description: 'Informe técnico actualizado exitosamente.' })
  @ApiBadRequestResponse({ description: 'ID inválido o datos incorrectos.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({ description: 'No tiene los roles necesarios.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTechnicalReportDto: UpdateTechnicalReportDto,
  ) {
    return this.technicalReportsService.update(id, updateTechnicalReportDto);
  }
}
