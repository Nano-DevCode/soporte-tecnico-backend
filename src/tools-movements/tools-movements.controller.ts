import { Controller, Get, Param, Query } from '@nestjs/common';
import { ToolsMovementsService } from './tools-movements.service';
import { FilterToolsMovementsDto } from './dto/filter-tools-movements.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsMovement } from './entities/tools-movement.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Tools Movements (Historial de Movimientos)')
@ApiCookieAuth() // Requiere autenticación
@Controller('tools-movements')
export class ToolsMovementsController {
  constructor(private readonly toolsMovementsService: ToolsMovementsService) {}

  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @Get()
  @ApiOperation({
    summary:
      'Obtener el historial general de movimientos de herramientas (entradas y salidas)',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de movimientos que coinciden con los filtros.',
    type: [ToolsMovement],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterToolsMovementsDto) {
    return this.toolsMovementsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary:
      'Obtener los detalles completos de un movimiento específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del movimiento a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los detalles del movimiento.',
    type: ToolsMovement,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.toolsMovementsService.findOne(id);
  }
}
