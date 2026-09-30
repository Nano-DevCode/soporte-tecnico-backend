import { Controller, Get, Param, Query } from '@nestjs/common';
import { ItAssetsMovementsService } from './it-assets-movements.service';
import { FilterItAssetsMovementsDto } from './dto/filter-it-assets-movements.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('IT Assets Movements (Historial de Movimientos)')
@ApiCookieAuth()
@Controller('it-assets-movements')
export class ItAssetsMovementsController {
  constructor(
    private readonly itAssetsMovementsService: ItAssetsMovementsService,
  ) {}

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener el historial general de movimientos (entradas y salidas)',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de movimientos que coinciden con los filtros.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterItAssetsMovementsDto: FilterItAssetsMovementsDto) {
    return this.itAssetsMovementsService.findAll(filterItAssetsMovementsDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
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
  @ApiOkResponse({ description: 'Retorna los detalles del movimiento.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.itAssetsMovementsService.findOne(id);
  }
}
