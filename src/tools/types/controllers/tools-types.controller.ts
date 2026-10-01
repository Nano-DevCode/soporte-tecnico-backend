import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ToolsTypesService } from '../services/tools-types.service';
import { CreateToolsTypeDto } from '../dto/create-tools-type.dto';
import { UpdateToolsTypeDto } from '../dto/update-tools-type.dto';
import { FilterToolsTypeDto } from '../dto/filter-tools-type.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsType } from '../entities/tools-type.entity';
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

@ApiTags('Tools Types (Tipos de Herramientas)')
@ApiCookieAuth()
@Controller('tools-types')
export class ToolsTypesController {
  constructor(private readonly toolsTypesService: ToolsTypesService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Registrar una nueva categoría o tipo de herramienta',
  })
  @ApiCreatedResponse({
    description: 'El tipo de herramienta se ha registrado exitosamente.',
    type: ToolsType,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsTypeDto: CreateToolsTypeDto) {
    return this.toolsTypesService.create(createToolsTypeDto);
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
      'Obtener el catálogo de tipos de herramientas con soporte para filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de tipos de herramientas que coinciden con la búsqueda.',
    type: [ToolsType],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll(@Query() filterDto: FilterToolsTypeDto) {
    return this.toolsTypesService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Actualizar el nombre de un tipo de herramienta existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de herramienta a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de herramienta ha sido actualizado correctamente.',
    type: ToolsType,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id') id: string,
    @Body() updateToolsTypeDto: UpdateToolsTypeDto,
  ) {
    return this.toolsTypesService.update(id, updateToolsTypeDto);
  }
}
