import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ToolsModelsService } from '../services/tools-models.service';
import { CreateToolsModelDto } from '../dto/create-tools-model.dto';
import { UpdateToolsModelDto } from '../dto/update-tools-model.dto';
import { FilterToolsModelDto } from '../dto/filter-tools-model.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsModel } from '../entities/tools-model.entity';
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

@ApiTags('Tools Models (Modelos de Herramientas)')
@ApiCookieAuth()
@Controller('tools-models')
export class ToolsModelsController {
  constructor(private readonly toolsModelsService: ToolsModelsService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
  )
  @ApiOperation({ summary: 'Registrar un nuevo modelo de herramienta' })
  @ApiCreatedResponse({
    description: 'El modelo se ha registrado exitosamente.',
    type: ToolsModel,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsModelDto: CreateToolsModelDto) {
    return this.toolsModelsService.create(createToolsModelDto);
  }

  @Get()
  @Auth(
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
  )
  @ApiOperation({
    summary: 'Obtener el catálogo de modelos con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de modelos que coinciden con los criterios de búsqueda.',
    type: [ToolsModel],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll(@Query() filterDto: FilterToolsModelDto) {
    return this.toolsModelsService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Actualizar los datos de un modelo existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del modelo a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El modelo ha sido actualizado correctamente.',
    type: ToolsModel,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id') id: string,
    @Body() updateToolsModelDto: UpdateToolsModelDto,
  ) {
    return this.toolsModelsService.update(id, updateToolsModelDto);
  }
}
