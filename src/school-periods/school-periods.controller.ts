import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseFilters,
  Query,
} from '@nestjs/common';
import { SchoolPeriodsService } from './school-periods.service';
import { CreateSchoolPeriodDto } from './dto/create-school-period.dto';
import { UpdateSchoolPeriodDto } from './dto/update-school-period.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { FilterSchoolPeriodDto } from './dto/filter-school-period.dto';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@UseFilters(DbexceptionFilter)
@ApiTags('School Periods')
@ApiCookieAuth()
@Controller('school-periods')
export class SchoolPeriodsController {
  constructor(private readonly schoolPeriodsService: SchoolPeriodsService) {}

  @Post()
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  @ApiOperation({ summary: 'Crear un nuevo periodo escolar' })
  @ApiResponse({
    status: 201,
    description: 'Periodo escolar creado exitosamente.',
  })
  @ApiForbiddenResponse({ description: 'No tiene los roles necesarios.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  create(@Body() createSchoolPeriodDto: CreateSchoolPeriodDto) {
    return this.schoolPeriodsService.create(createSchoolPeriodDto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Listar periodos escolares' })
  @ApiResponse({
    status: 200,
    description: 'Retorna la lista paginada de periodos escolares.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  findAll(@Query() filterSchoolPeriodDto: FilterSchoolPeriodDto) {
    return this.schoolPeriodsService.findAll(filterSchoolPeriodDto);
  }

  @Get('for-select')
  @Auth()
  @ApiOperation({ summary: 'Listar periodos escolares para componente select' })
  @ApiResponse({
    status: 200,
    description:
      'Retorna la lista sin paginar de periodos escolares para ser usada en un select.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  findAllForSelect() {
    return this.schoolPeriodsService.findAllForSelect();
  }

  @Get(':id')
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener un periodo escolar por ID' })
  @ApiParam({ name: 'id', description: 'UUID del periodo escolar' })
  @ApiResponse({ status: 200, description: 'Datos del periodo escolar.' })
  @ApiNotFoundResponse({ description: 'Periodo no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolPeriodsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un periodo escolar' })
  @ApiParam({ name: 'id', description: 'UUID del periodo escolar' })
  @ApiResponse({
    status: 200,
    description: 'Periodo actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSchoolPeriodDto: UpdateSchoolPeriodDto,
  ) {
    return this.schoolPeriodsService.update(id, updateSchoolPeriodDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un periodo escolar' })
  @ApiParam({ name: 'id', description: 'UUID del periodo escolar' })
  @ApiResponse({ status: 200, description: 'Periodo activado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolPeriodsService.activateSchoolPeriod(id);
  }

  @Patch(':id/deactivate')
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  @ApiOperation({ summary: 'Desactivar un periodo escolar' })
  @ApiParam({ name: 'id', description: 'UUID del periodo escolar' })
  @ApiResponse({ status: 200, description: 'Periodo desactivado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolPeriodsService.deactivateSchoolPeriod(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un periodo escolar' })
  @ApiParam({ name: 'id', description: 'UUID del periodo escolar' })
  @ApiResponse({ status: 200, description: 'Periodo eliminado.' })
  @ApiNotFoundResponse({ description: 'Periodo no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  @Auth(ValidRole.jefecc, ValidRole.superAdmin, ValidRole.coordinador)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolPeriodsService.remove(id);
  }
}
