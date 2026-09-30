import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ItAssetsMovementsInService } from './it-assets-movements-in.service';
import { CreateItAssetsMovementsInDto } from './dto/create-it-assets-movements-in.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('IT Assets Movements In (Entradas)')
@ApiCookieAuth() // Indica que la ruta requiere autenticación
@Controller('it-assets-movements-in')
export class ItAssetsMovementsInController {
  constructor(
    private readonly itAssetsMovementsInService: ItAssetsMovementsInService,
  ) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({
    summary: 'Registrar un nuevo movimiento de entrada para un activo TI',
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
  create(@Body() createItAssetsMovementsInDto: CreateItAssetsMovementsInDto) {
    return this.itAssetsMovementsInService.create(createItAssetsMovementsInDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener los detalles de un movimiento de entrada por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del movimiento de entrada',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la información del movimiento de entrada.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.itAssetsMovementsInService.findOne(id);
  }
}
