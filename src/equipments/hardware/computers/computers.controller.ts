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
import { ComputersService } from './computers.service';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Computers (Equipos de cómputo)')
@ApiCookieAuth()
@Controller('computers')
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

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
      'Obtener las especificaciones de hardware de una computadora mediante el ID de Equipo (Equipment)',
  })
  @ApiParam({
    name: 'equipmentId',
    description:
      'UUID del equipo general (Equipment) para extraer su detalle técnico de computadora',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Retorna la ficha técnica de la computadora y sus relaciones asociadas.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token o sesión inválida.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de lectura insuficientes.',
  })
  findOne(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.computersService.findOneByEquipment(equipmentId);
  }
}
