import { Controller, Get } from '@nestjs/common';
import { DepartmentSeedService } from './department-seed.service';
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
@Controller('departament-seed')
export class DepartmentSeedController {
  constructor(private readonly departmentSeedService: DepartmentSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Ejecutar el llenado inicial de departamentos (Seed)',
  })
  @ApiOkResponse({
    description: 'Seed de departamentos ejecutado correctamente.',
  })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de departamentos ya fue ejecutado anteriormente y la base de datos no está vacía.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.departmentSeedService.runSeed();
  }
}
