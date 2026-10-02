import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NetworksService } from './networks.service';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Networks (Equipos de red)')
@ApiCookieAuth()
@Controller('networks')
export class NetworksController {
  constructor(private readonly networksService: NetworksService) {}

  @Get(':equipmentId')
  // @Auth(
  //   ValidRole.superAdmin,
  //   ValidRole.jefe,
  //   ValidRole.coordinador,
  //   ValidRole.inventory,
  //   ValidRole.jefecc,
  //   ValidRole.secretaria,
  //   ValidRole.tecnico,
  // )
  @ApiOperation({
    summary:
      'Obtener las especificaciones técnicas de red mediante el ID de Equipo (Equipment)',
  })
  @ApiParam({
    name: 'equipmentId',
    description:
      'UUID del equipo general (Equipment) para extraer su detalle de infraestructura de red',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la ficha técnica del equipo de red y sus relaciones.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token de sesión ausente o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de lectura insuficientes.',
  })
  findOne(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.networksService.findOneByEquipment(equipmentId);
  }
}
