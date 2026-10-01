import { Controller, Post, Body } from '@nestjs/common';
import { ItAssetsMovementsOutService } from '../services/it-assets-movements-out.service';
import { CreateItAssetsMovementsOutDto } from '../dto/create-it-assets-movements-out.dto';
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

@ApiTags('IT Assets Movements Out (Salidas)')
@ApiCookieAuth()
@Controller('it-assets-movements-out')
export class ItAssetsMovementsOutController {
  constructor(
    private readonly itAssetsMovementsOutService: ItAssetsMovementsOutService,
  ) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.planning,
  )
  @ApiOperation({
    summary: 'Registrar un nuevo movimiento de salida para un activo TI',
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
  create(@Body() createItAssetsMovementsOutDto: CreateItAssetsMovementsOutDto) {
    return this.itAssetsMovementsOutService.create(
      createItAssetsMovementsOutDto,
    );
  }
}
