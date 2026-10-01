import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ItAssetsBrandsService } from '../services/it-assets-brands.service';
import { CreateItAssetsBrandDto } from '../dto/create-it-assets-brand.dto';
import { UpdateItAssetsBrandDto } from '../dto/update-it-assets-brand.dto';
import { FilterItAssetsBrandDto } from '../dto/filter-it-assets-brand.dto';
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

@ApiTags('IT Assets Brands (Marcas)')
@ApiCookieAuth()
@Controller('it-assets-brands')
export class ItAssetsBrandsController {
  constructor(private readonly itAssetsBrandsService: ItAssetsBrandsService) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Crear una nueva marca de activo TI' })
  @ApiCreatedResponse({
    description: 'La marca ha sido registrada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createItAssetsBrandDto: CreateItAssetsBrandDto) {
    return this.itAssetsBrandsService.create(createItAssetsBrandDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener la lista de marcas con soporte para filtros y paginación',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de marcas que coinciden con los criterios.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterItAssetsBrandDto) {
    return this.itAssetsBrandsService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Actualizar los datos de una marca existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la marca a actualizar',
    type: 'string',
  })
  @ApiOkResponse({ description: 'La marca ha sido actualizada exitosamente.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id') id: string,
    @Body() updateItAssetsBrandDto: UpdateItAssetsBrandDto,
  ) {
    return this.itAssetsBrandsService.update(id, updateItAssetsBrandDto);
  }
}
