import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ToolsStatusService } from './tools-status.service';
import { CreateToolsStatusDto } from './dto/create-tools-status.dto';
import { UpdateToolsStatusDto } from './dto/update-tools-status.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsStatus } from './entities/tools-status.entity';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Tools Status (Estados de Herramientas)')
@ApiCookieAuth() // Requiere autenticación
@Controller('tools-status')
export class ToolsStatusController {
  constructor(private readonly toolsStatusService: ToolsStatusService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Crear un nuevo estado físico/operativo para las herramientas',
  })
  @ApiCreatedResponse({
    description: 'El estado se ha registrado exitosamente.',
    type: ToolsStatus,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsStatusDto: CreateToolsStatusDto) {
    return this.toolsStatusService.create(createToolsStatusDto);
  }

  @Get('seed')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary:
      'Inicializar estados por defecto en la base de datos (Exclusivo Super Admin)',
  })
  @ApiOkResponse({
    description: 'Los estados por defecto se han cargado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Se requiere rol de Super Admin.',
  })
  seed() {
    return this.toolsStatusService.seed();
  }

  @Get()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener el catálogo completo de estados disponibles',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de todos los estados.',
    type: [ToolsStatus],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll() {
    return this.toolsStatusService.findAll();
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({ summary: 'Actualizar la información de un estado existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del estado a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado ha sido actualizado correctamente.',
    type: ToolsStatus,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id') id: string,
    @Body() updateToolsStatusDto: UpdateToolsStatusDto,
  ) {
    return this.toolsStatusService.update(+id, updateToolsStatusDto);
  }
}
