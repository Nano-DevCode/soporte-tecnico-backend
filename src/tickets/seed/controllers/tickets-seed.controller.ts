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
import { TicketsSeedService } from '../services/tickets-seed.service';

@ApiTags('Seed')
@ApiCookieAuth()
@Controller('tickets-seed')
export class TicketsSeedController {
  constructor(private readonly ticketsSeedService: TicketsSeedService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Ejecutar el llenado inicial de tickets de soporte (Seed)',
    description:
      'Puebla los catálogos base (estados, tipos de problema, etiquetas, periodo escolar) y genera tickets de ejemplo con historial y asignaciones.',
  })
  @ApiOkResponse({
    description: 'Seed de tickets ejecutado correctamente.',
  })
  @ApiConflictResponse({
    description:
      'Conflicto: El seed de tickets ya fue ejecutado anteriormente y ya existen registros en el sistema.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere iniciar sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  async runSeed() {
    return this.ticketsSeedService.runSeed();
  }
}

