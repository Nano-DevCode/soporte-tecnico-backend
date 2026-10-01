import { Controller, Post, Body } from '@nestjs/common';
import { ToolsMovementsInService } from '../services/tools-movements-in.service';
import { CreateToolsMovementsInDto } from '../dto/create-tools-movements-in.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Tools Movements In (Entradas de Herramientas)')
@ApiCookieAuth()
@Controller('tools-movements-in')
export class ToolsMovementsInController {
  constructor(
    private readonly toolsMovementsInService: ToolsMovementsInService,
  ) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Registrar un nuevo movimiento de entrada para una herramienta',
  })
  @ApiCreatedResponse({
    description: 'El movimiento de entrada se ha registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsMovementsInDto: CreateToolsMovementsInDto) {
    return this.toolsMovementsInService.create(createToolsMovementsInDto);
  }
}
