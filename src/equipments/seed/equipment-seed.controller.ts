import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { EquipmentSeedService } from './equipment-seed.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Equipments Seeds (Seed de equipos)')
@ApiCookieAuth()
@Controller('equipment-seed')
export class EquipmentSeedController {
  constructor(private readonly equipmentSeedService: EquipmentSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Poblar la base de datos con información de prueba (Seed)',
    description:
      'Inserta catálogos base (marcas, modelos, tipos de red) y equipos de prueba en el inventario.',
  })
  @ApiOkResponse({
    description:
      'El procedimiento de inicialización (Seed) se ha ejecutado de forma exitosa.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token de sesión ausente o caducado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requieren privilegios de superAdmin para ejecutar esta acción.',
  })
  runSeed() {
    return this.equipmentSeedService.RunSeed();
  }
}
