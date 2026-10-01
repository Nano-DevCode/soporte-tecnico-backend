import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ItAssetsSeedService } from '../services/it-assets-seed.service';

@ApiTags('Seed')
@ApiCookieAuth()
@Controller('it-assets-seed')
export class ItAssetsSeedController {
  constructor(private readonly itAssetsSeedService: ItAssetsSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Ejecutar el llenado inicial de activos de TI (Seed)',
    description:
      'Puebla los catálogos base (estados, tipos, facturas, marcas y modelos) e inserta el inventario inicial de activos de TI.',
  })
  @ApiOkResponse({
    description: 'Seed de activos de TI ejecutado correctamente.',
  })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de activos de TI ya fue ejecutado anteriormente y ya existen registros en el inventario.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.itAssetsSeedService.runSeed();
  }
}
