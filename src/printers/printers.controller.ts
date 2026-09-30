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
import { PrintersService } from './printers.service';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Printers (Equipos de impresión)')
@ApiCookieAuth()
@Controller('printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

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
      'Obtener las especificaciones de impresora vinculadas a un Equipo (Equipment)',
  })
  @ApiParam({
    name: 'equipmentId',
    description:
      'UUID del equipo general (Equipment) para extraer su detalle de impresora',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos específicos de la impresora asociada.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token o sesión iniciada.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Permisos insuficientes para consultar inventario.',
  })
  findOne(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.printersService.findOneByEquipment(equipmentId);
  }
}
