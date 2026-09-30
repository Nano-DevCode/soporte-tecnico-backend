import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseFilters,
  Query,
} from '@nestjs/common';
import { ComputingCenterManagerService } from './computing-center-manager.service';
import { CreateComputingCenterManagerDto } from './dto/create-computing-center-manager.dto';
import { UpdateComputingCenterManagerDto } from './dto/update-computing-center-manager.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { FilterComputingCenterManagerDto } from './dto/filter-computing-center-managers.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiTags,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';

@UseFilters(DbexceptionFilter)
@ApiTags('Computing Center Manager')
@ApiCookieAuth()
@Controller('computing-center-manager')
export class ComputingCenterManagerController {
  constructor(
    private readonly computingCenterManagerService: ComputingCenterManagerService,
  ) {}

  @Post()
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Crear un nuevo Jefe de Centro de Cómputo' })
  @ApiResponse({
    status: 201,
    description: 'El Jefe de Centro de Cómputo fue creado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  @ApiConflictResponse({
    description: 'Ya existe un registro con este RFC.',
  })
  create(
    @Body() createComputingCenterManagerDto: CreateComputingCenterManagerDto,
  ) {
    return this.computingCenterManagerService.create(
      createComputingCenterManagerDto,
    );
  }

  @Get()
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Obtener lista paginada de Jefes de Centro de Cómputo',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna la lista de los jefes de centro de cómputo con paginación.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  findAll(
    @Query() filterComputingCenterManagerDto: FilterComputingCenterManagerDto,
  ) {
    return this.computingCenterManagerService.findAll(
      filterComputingCenterManagerDto,
    );
  }

  @Get(':id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener un Jefe de Centro de Cómputo por su ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del Jefe de Centro de Cómputo',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna los datos del Jefe solicitado.',
  })
  @ApiBadRequestResponse({
    description: 'El ID proporcionado no es un UUID válido.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el Jefe de Centro de Cómputo.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.computingCenterManagerService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar datos de un Jefe de Centro de Cómputo' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del Jefe de Centro de Cómputo',
  })
  @ApiResponse({
    status: 200,
    description: 'El Jefe de Centro de Cómputo fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El ID no es un UUID válido o los datos enviados son incorrectos.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el Jefe de Centro de Cómputo.',
  })
  @ApiConflictResponse({
    description: 'Ya existe un registro con este RFC.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComputingCenterManagerDto: UpdateComputingCenterManagerDto,
  ) {
    return this.computingCenterManagerService.update(
      id,
      updateComputingCenterManagerDto,
    );
  }

  @Patch(':id/activate')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Activar un Jefe de Centro de Cómputo' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del Jefe de Centro de Cómputo a activar',
  })
  @ApiResponse({
    status: 200,
    description: 'El Jefe fue activado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'El ID no es un UUID válido.' })
  @ApiNotFoundResponse({
    description: 'No se encontró el Jefe de Centro de Cómputo.',
  })
  @ApiConflictResponse({
    description: 'Ya existe otro Jefe de Centro de Cómputo activo actualmente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.computingCenterManagerService.activateManager(id);
  }

  @Patch(':id/deactivate')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Desactivar un Jefe de Centro de Cómputo' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del Jefe de Centro de Cómputo a desactivar',
  })
  @ApiResponse({
    status: 200,
    description: 'El Jefe fue desactivado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'El ID no es un UUID válido.' })
  @ApiNotFoundResponse({
    description: 'No se encontró el Jefe de Centro de Cómputo.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios para realizar esta acción.',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.computingCenterManagerService.deactivateManager(id);
  }
}
