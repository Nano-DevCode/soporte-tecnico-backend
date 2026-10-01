import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { FilterDepartmentDto } from '../dto/filter-department.dto';
import { ChangeDepartmentStatusDto } from '../dto/change-status.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
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

@ApiTags('Departments')
@ApiCookieAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Crear un nuevo departamento' })
  @ApiCreatedResponse({
    description: 'El departamento ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requiere rol de superAdmin, jefe o coordinador.',
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get('filter')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefe,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.secretaria,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener lista de departamentos filtrada y paginada',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de departamentos según los filtros especificados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAllFilter(@Query() filterDepartmentDto: FilterDepartmentDto) {
    return this.departmentsService.findAllFilter(filterDepartmentDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.planning,
    ValidRole.secretaria,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Obtener lista de todos los departamentos' })
  @ApiOkResponse({ description: 'Retorna la lista completa de departamentos.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Obtener un departamento específico por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del departamento encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch('change/:id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Activar o desactivar el estado de un departamento',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado del departamento ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeDepartmentStatusDto,
  ) {
    return this.departmentsService.changeStatus(id, changeStatusDto);
  }

  @Patch(':id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Actualizar los datos de un departamento existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Los datos del departamento han sido actualizados exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Eliminar un departamento' })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento a eliminar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El departamento ha sido eliminado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}

