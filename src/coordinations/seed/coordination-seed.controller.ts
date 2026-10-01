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
@ApiCookieAuth()
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
    description: 'El seed de coordinaciones ya fue ejecutado anteriormente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requiere rol de superAdmin para ejecutar seeds.',
  })
  runSeed() {
    return this.coordinationSeedService.runSeed();
  }
}
