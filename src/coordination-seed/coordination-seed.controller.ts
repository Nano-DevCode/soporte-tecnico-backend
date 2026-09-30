import { Controller, Get } from '@nestjs/common';
import { CoordinationSeedService } from './coordination-seed.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Seed')
@ApiCookieAuth() // Indica que esta ruta requiere la cookie de autenticación
@Controller('coordination-seed')
export class CoordinationSeedController {
  constructor(
    private readonly coordinationSeedService: CoordinationSeedService,
  ) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Ejecutar el llenado inicial de coordinaciones (Seed)',
  })
  @ApiOkResponse({
    description: 'Seed de coordinaciones ejecutado correctamente.',
  })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de coordinaciones ya fue ejecutado anteriormente y la base de datos no está vacía.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.coordinationSeedService.runSeed();
  }
}
