import { Controller, Get } from '@nestjs/common';
import { RoleSeedService } from './role-seed.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Seed')
@ApiCookieAuth()
@Controller('role-seed')
export class RoleSeedController {
  constructor(private readonly roleSeedService: RoleSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Ejecutar el llenado inicial de roles (Seed)' })
  @ApiOkResponse({ description: 'Seed de roles ejecutado correctamente.' })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de roles ya fue ejecutado anteriormente y la base de datos no está vacía.',
  })
  @ApiBadRequestResponse({
    description:
      'Error al insertar los roles (ej. datos duplicados o inválidos en el seed).',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.roleSeedService.runSeed();
  }
}
