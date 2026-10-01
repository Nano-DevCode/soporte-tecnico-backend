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
import { ToolsSeedService } from '../services/tools-seed.service';

@ApiTags('Seed')
@ApiCookieAuth()
@Controller('tools-seed')
export class ToolsSeedController {
  constructor(private readonly toolsSeedService: ToolsSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Ejecutar el llenado inicial de herramientas (Seed)',
    description:
      'Puebla los catálogos base (estados, tipos, facturas, marcas y modelos) e inserta el inventario inicial de herramientas.',
  })
  @ApiOkResponse({
    description: 'Seed de herramientas ejecutado correctamente.',
  })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de herramientas ya fue ejecutado anteriormente y ya existen registros en el inventario.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.toolsSeedService.runSeed();
  }
}
