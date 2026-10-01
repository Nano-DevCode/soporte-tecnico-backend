import { Controller, Get } from '@nestjs/common';
import { UserSeedService } from './user-seed.service';
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
@Controller('user-seed')
export class UserSeedController {
  constructor(private readonly userSeedService: UserSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Ejecutar el llenado inicial de usuarios (Seed)' })
  @ApiOkResponse({ description: 'Seed de usuarios ejecutado correctamente.' })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de usuarios ya fue ejecutado anteriormente y la base de datos no está vacía.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return await this.userSeedService.runSeed();
  }
}
