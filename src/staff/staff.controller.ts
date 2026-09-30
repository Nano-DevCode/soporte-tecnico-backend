import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { FilterStaffDto } from './dto/filter-staff.dto';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TechnicianKpiService } from './technician-kpi.service';
import { FilterKpiDto } from './dto/filter-kpi.dto';

@ApiTags('Staff')
@ApiCookieAuth()
@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly technicianKpiService: TechnicianKpiService,
  ) {}

  @Auth(ValidRole.superAdmin)
  @Post()
  @ApiOperation({ summary: 'Crear un perfil (Mas que nada para seeder)' })
  @ApiCreatedResponse({
    description: 'El miembro del personal ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requiere rol de coordinador, jefe o superAdmin.',
  })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get('/technical')
  @ApiOperation({ summary: 'Obtener lista de técnico' })
  @ApiOkResponse({ description: 'Retorna la lista de personal técnico.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAllTechnical() {
    return this.staffService.findAllTechnical2();
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get('/coordinators')
  @ApiOperation({ summary: 'Obtener lista de coordinadores' })
  @ApiOkResponse({
    description: 'Retorna la lista de personal con perfil de coordinador.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAllCoordinators() {
    return this.staffService.findAllCoordinators();
  }

  @Get('/department-managers')
  findAllDepartmentManagers() {
    return this.staffService.findAllDepartmentManagers();
  }

  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.inventory,
  )
  @Get('/roleSpecific')
  @ApiOperation({
    summary: 'Obtener lista de personal filtrada por un rol específico',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista del personal que coincide con los filtros aplicados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAllWithRoleSpecific(@Query() filterDto: FilterStaffDto) {
    return this.staffService.findAllWithRoleSpecific(filterDto);
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get()
  @ApiOperation({ summary: 'Obtener lista de todo el personal' })
  @ApiOkResponse({
    description: 'Retorna la lista completa del personal registrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll() {
    return this.staffService.findAll();
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get('technicians-resolution')
  @ApiOperation({
    summary: 'Obtener KPI de tickets resueltos por cada técnico',
  })
  @ApiOkResponse({
    description: 'Lista de técnicos con su conteo de tickets resueltos.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  getTechniciansResolution(@Query() filterDto: FilterStaffDto) {
    return this.staffService.getTechniciansResolutionKpi(filterDto);
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get('technicians-kpis')
  @ApiOperation({
    summary:
      'Obtener los KPIs globales de los técnicos (Efectividad, Tiempos, Pendientes) de forma paginada',
  })
  @ApiOkResponse({
    description:
      'Lista de técnicos con sus métricas ordenadas por el mejor candidato para asignación.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  getTechniciansKpis(@Query() filterDto: FilterKpiDto) {
    return this.technicianKpiService.getTechniciansResolutionKpi(filterDto);
  }

  @Auth(ValidRole.coordinador, ValidRole.jefecc, ValidRole.superAdmin)
  @Get('force-kpi-now')
  async forceKpiNow() {
    await this.technicianKpiService.triggerKpiCalculation();
    return {
      message:
        'Orden enviada a Redis. Revisa la consola de NestJS en tu terminal.',
    };
  }

  @Auth(ValidRole.superAdmin)
  @Post('sync-search-fields')
  async syncSearchFields() {
    return this.staffService.syncSearchFields();
  }

  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.visitor,
  )
  @Get(':id')
  @ApiOperation({
    summary:
      'Obtener el perfil de un miembro del personal específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del miembro del personal a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del miembro del personal encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Auth(ValidRole.superAdmin)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un miembro del personal' })
  @ApiParam({
    name: 'id',
    description: 'UUID del miembro del personal a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Los datos del personal han sido actualizados exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }
}
