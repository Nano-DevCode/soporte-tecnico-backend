import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ItAssetsTypesService } from './it-assets-types.service';
import { CreateItAssetsTypeDto } from './dto/create-it-assets-type.dto';
import { UpdateItAssetsTypeDto } from './dto/update-it-assets-type.dto';
import { FilterItAssetsTypeDto } from './dto/filter-it-assets-type.dto';
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

@ApiTags('IT Assets Types (Tipos de Activos)')
@ApiCookieAuth() // Indica que las rutas requieren autenticación
@Controller('it-assets-types')
export class ItAssetsTypesController {
  constructor(private readonly itAssetsTypesService: ItAssetsTypesService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({ summary: 'Registrar un nuevo tipo o categoría de activo TI' })
  @ApiCreatedResponse({
    description: 'El tipo de activo se ha registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createItAssetsTypeDto: CreateItAssetsTypeDto) {
    return this.itAssetsTypesService.create(createItAssetsTypeDto);
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
    summary:
      'Obtener el catálogo de tipos de activos con soporte para filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de tipos de activos que coinciden con la búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterItAssetsTypeDto) {
    return this.itAssetsTypesService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Actualizar el nombre de un tipo de activo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de activo a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de activo ha sido actualizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id') id: string,
    @Body() updateItAssetsTypeDto: UpdateItAssetsTypeDto,
  ) {
    return this.itAssetsTypesService.update(+id, updateItAssetsTypeDto);
  }
}
