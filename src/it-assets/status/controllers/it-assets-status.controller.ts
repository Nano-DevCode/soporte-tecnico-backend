import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ItAssetsStatusService } from '../services/it-assets-status.service';
import { CreateItAssetsStatusDto } from '../dto/create-it-assets-status.dto';
import { UpdateItAssetsStatusDto } from '../dto/update-it-assets-status.dto';
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

@ApiTags('IT Assets Status (Estados de Inventario)')
@ApiCookieAuth()
@Controller('it-assets-status')
export class ItAssetsStatusController {
  constructor(private readonly itAssetsStatusService: ItAssetsStatusService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Crear un nuevo estado físico/operativo para los activos TI',
  })
  @ApiCreatedResponse({
    description: 'El estado se ha registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createItAssetsStatusDto: CreateItAssetsStatusDto) {
    return this.itAssetsStatusService.create(createItAssetsStatusDto);
  }

  @Get()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener el catálogo completo de estados disponibles',
  })
  @ApiOkResponse({ description: 'Retorna la lista de todos los estados.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll() {
    return this.itAssetsStatusService.findAll();
  }

  @Get('seed')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary:
      'Inicializar estados por defecto en la base de datos (Exclusivo Super Admin)',
  })
  @ApiOkResponse({
    description: 'Los estados por defecto se han cargado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Se requiere rol de Super Admin.',
  })
  seed() {
    return this.itAssetsStatusService.seed();
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({ summary: 'Actualizar la información de un estado existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del estado a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado ha sido actualizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItAssetsStatusDto: UpdateItAssetsStatusDto,
  ) {
    return this.itAssetsStatusService.update(id, updateItAssetsStatusDto);
  }
}
