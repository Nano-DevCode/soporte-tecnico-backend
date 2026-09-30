import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BrandConsumablesService } from './brand-consumables.service';
import { CreateBrandConsumableDto } from './dto/create-brand-consumable.dto';
import { UpdateBrandConsumableDto } from './dto/update-brand-consumable.dto';
import { FilterBrandconsumablesDto } from './dto/filter-brand-consumable.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Brand Consumables (Marcas de consumibles)')
@ApiCookieAuth()
@Controller('brand-consumables')
export class BrandConsumablesController {
  constructor(
    private readonly brandConsumablesService: BrandConsumablesService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Registrar un nuevo fabricante o marca de consumibles',
  })
  @ApiCreatedResponse({
    description: 'La marca de consumible ha sido guardada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createBrandConsumableDto: CreateBrandConsumableDto) {
    return this.brandConsumablesService.create(createBrandConsumableDto);
  }

  @Get()
  // @Auth(
  //   ValidRole.superAdmin,
  //   ValidRole.jefe,
  //   ValidRole.coordinador,
  //   ValidRole.inventory,
  //   ValidRole.jefecc,
  //   ValidRole.secretaria,
  //   ValidRole.tecnico,
  // )
  @ApiOperation({
    summary:
      'Obtener el catálogo de marcas de consumibles con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de marcas según los criterios de búsqueda establecidos.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterBrandconsumablesDto) {
    return this.brandConsumablesService.findAll(filterDto);
  }

  @Get(':id')
  // @Auth(
  //   ValidRole.superAdmin,
  //   ValidRole.jefecc,
  //   ValidRole.coordinador,
  //   ValidRole.inventory,
  //   ValidRole.secretaria,
  //   ValidRole.tecnico,
  // )
  @ApiOperation({
    summary: 'Obtener detalles de una marca de consumible por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la marca a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la información de la marca solicitada.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandConsumablesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar una marca de consumibles existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la marca a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'El registro de la marca ha sido modificado de forma correcta.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandConsumableDto: UpdateBrandConsumableDto,
  ) {
    return this.brandConsumablesService.update(id, updateBrandConsumableDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar una marca de consumibles del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID de la marca a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description:
  //     'El fabricante ha sido eliminado de la base de datos de manera exitosa.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.brandConsumablesService.remove(id);
  // }
}
