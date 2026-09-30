import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseFilters,
} from '@nestjs/common';
import { FolioCountersService } from './folio-counters.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { UpdateFolioCounterDto } from './dto/update-folio-counter.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@UseFilters(DbexceptionFilter)
@ApiTags('Folio Counters')
@ApiCookieAuth()
@Controller('folio-counters')
export class FolioCountersController {
  constructor(private readonly folioCountersService: FolioCountersService) {}

  @Get('current-period/departments')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Obtener contadores de folios de solicitudes de todos los departamentos en el periodo actual',
  })
  @ApiOkResponse({
    description:
      'Lista de contadores de folios de solicitudes de los departamentos obtenida correctamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getCountersForTable() {
    return this.folioCountersService.getCurrentPeriodDepartmentCounters();
  }

  @Patch('current-period/departments/:departmentId')
  @ApiOperation({
    summary:
      'Actualizar (saltar) el contador de folio de solicitudes de un departamento específico',
  })
  @ApiParam({
    name: 'departmentId',
    type: String,
    description: 'UUID del departamento',
  })
  @ApiOkResponse({
    description:
      'El contador de folio del departamento fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o el UUID es incorrecto.',
  })
  @ApiNotFoundResponse({ description: 'Departamento no encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  async jumpCurrentPeriodCounter(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() updateFolioDto: UpdateFolioCounterDto,
  ) {
    return this.folioCountersService.jumpCurrentPeriodDepartmentCounter(
      departmentId,
      updateFolioDto,
    );
  }

  @Get('current-period/departments/:departmentId')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Obtener detalles del contador de solicitudes de un departamento específico en el periodo actual',
  })
  @ApiParam({
    name: 'departmentId',
    type: String,
    description: 'UUID del departamento',
  })
  @ApiOkResponse({
    description: 'Detalle del contador de solicitudes obtenido correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'El UUID proporcionado es incorrecto.',
  })
  @ApiNotFoundResponse({ description: 'Departamento no encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getDepartmentCounterDetail(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    return this.folioCountersService.getCurrentPeriodDepartmentCounterDetail(
      departmentId,
    );
  }

  @Get('current-period/my-department')
  @Auth(ValidRole.superAdmin, ValidRole.jefe, ValidRole.planning)
  @ApiOperation({
    summary:
      'Obtener detalles del contador de solicitudes del departamento del usuario autenticado',
  })
  @ApiOkResponse({
    description:
      'Detalles del contador de solicitudes de tu departamento obtenido correctamente.',
  })
  @ApiNotFoundResponse({
    description: 'Departamento no encontrado para el usuario actual.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getMyDepartmentCounterDetail(@GetUser() user: User) {
    return this.folioCountersService.getCurrentPeriodMyDepartmentCounterDetail(
      user,
    );
  }

  @Patch('current-period/my-department')
  @Auth(ValidRole.superAdmin, ValidRole.jefe, ValidRole.planning)
  @ApiOperation({
    summary:
      'Actualizar (saltar) el contador de folios de solicitudes del departamento del usuario autenticado',
  })
  @ApiOkResponse({
    description:
      'El contador de folios de tu departamento fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos en el body.' })
  @ApiNotFoundResponse({
    description: 'Departamento no encontrado para el usuario actual.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async jumpMyDepartmentCounter(
    @GetUser() user: User,
    @Body() updateFolioDto: UpdateFolioCounterDto,
  ) {
    return this.folioCountersService.jumpMyDepartmentCounter(
      user,
      updateFolioDto,
    );
  }

  @Get('current-year/responses')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Obtener detalles del contador de folio general de respuestas (órdenes de trabajo)',
  })
  @ApiOkResponse({
    description: 'Detalle del contador de respuestas obtenido correctamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getResponseCounterDetail() {
    return this.folioCountersService.getCurrentYearResponseCounterDetail();
  }

  @Patch('current-year/responses')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Actualizar (saltar) el contador de folios de respuestas (órdenes de trabajo)',
  })
  @ApiOkResponse({
    description: 'El contador de respuestas fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos en el body.' })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async jumpResponseCounter(@Body() updateFolioDto: UpdateFolioCounterDto) {
    return this.folioCountersService.jumpCurrentYearResponseCounter(
      updateFolioDto,
    );
  }

  @Get('current-year/ot')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Obtener detalles del contador de folio general OT (Orden de Trabajo) para el año actual',
  })
  @ApiOkResponse({
    description: 'Detalle del contador OT obtenido correctamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async getOTCounterDetail() {
    return this.folioCountersService.getCurrentYearOTCounterDetail();
  }

  @Patch('current-year/ot')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  @ApiOperation({
    summary:
      'Actualizar (saltar) el contador general OT (Orden de Trabajo) para el año actual',
  })
  @ApiOkResponse({
    description: 'El contador OT fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos en el body.' })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  async jumpOTCounter(@Body() updateFolioDto: UpdateFolioCounterDto) {
    return this.folioCountersService.jumpCurrentYearOTCounter(updateFolioDto);
  }
}
