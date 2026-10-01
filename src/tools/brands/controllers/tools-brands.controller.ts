import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ToolsBrandsService } from '../services/tools-brands.service';
import { CreateToolsBrandDto } from '../dto/create-tools-brand.dto';
import { UpdateToolsBrandDto } from '../dto/update-tools-brand.dto';
import { FilterToolsBrandDto } from '../dto/filter-tools-brand.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsBrand } from '../entities/tools-brand.entity';
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

@ApiTags('Tools Brands (Marcas de Herramientas)')
@ApiCookieAuth()
@Controller('tools-brands')
export class ToolsBrandsController {
  constructor(private readonly toolsBrandsService: ToolsBrandsService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({ summary: 'Registrar una nueva marca de herramientas' })
  @ApiCreatedResponse({
    description: 'La marca se ha registrado exitosamente.',
    type: ToolsBrand,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsBrandDto: CreateToolsBrandDto) {
    return this.toolsBrandsService.create(createToolsBrandDto);
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
      'Obtener el catálogo de marcas de herramientas con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de marcas que coinciden con los criterios de búsqueda.',
    type: [ToolsBrand],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll(@Query() filterDto: FilterToolsBrandDto) {
    return this.toolsBrandsService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({ summary: 'Actualizar los datos de una marca existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la marca a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'La marca ha sido actualizada correctamente.',
    type: ToolsBrand,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id') id: string,
    @Body() updateToolsBrandDto: UpdateToolsBrandDto,
  ) {
    return this.toolsBrandsService.update(id, updateToolsBrandDto);
  }
}
