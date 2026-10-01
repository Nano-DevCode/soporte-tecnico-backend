import { Controller, Post, Body } from '@nestjs/common';
import { ToolsMovementsOutService } from '../services/tools-movements-out.service';
import { CreateToolsMovementsOutDto } from '../dto/create-tools-movements-out.dto';
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

@ApiTags('Tools Movements Out (Salidas de Herramientas)')
@ApiCookieAuth()
@Controller('tools-movements-out')
export class ToolsMovementsOutController {
  constructor(
    private readonly toolsMovementsOutService: ToolsMovementsOutService,
  ) {}

  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @Post()
  @ApiOperation({
    summary: 'Registrar un nuevo movimiento de salida para una herramienta',
  })
  @ApiCreatedResponse({
    description: 'El movimiento de salida se ha registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsMovementsOutDto: CreateToolsMovementsOutDto) {
    return this.toolsMovementsOutService.create(createToolsMovementsOutDto);
  }
}
