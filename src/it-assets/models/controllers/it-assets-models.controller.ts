import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ItAssetsModelsService } from '../services/it-assets-models.service';
import { CreateItAssetsModelDto } from '../dto/create-it-assets-model.dto';
import { UpdateItAssetsModelDto } from '../dto/update-it-assets-model.dto';
import { FilterItAssetsModelDto } from '../dto/filter-it-assets-model.dto';
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

@ApiTags('IT Assets Models (Modelos)')
@ApiCookieAuth()
@Controller('it-assets-models')
export class ItAssetsModelsController {
  constructor(private readonly itAssetsModelsService: ItAssetsModelsService) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Registrar un nuevo modelo de activo TI' })
  @ApiCreatedResponse({
    description: 'El modelo ha sido registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createItAssetsModelDto: CreateItAssetsModelDto) {
    return this.itAssetsModelsService.create(createItAssetsModelDto);
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
    summary: 'Obtener la lista de modelos con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de modelos que coinciden con los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterItAssetsModelDto) {
    return this.itAssetsModelsService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Actualizar los datos de un modelo existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del modelo a actualizar',
    type: 'string',
  })
  @ApiOkResponse({ description: 'El modelo ha sido actualizado exitosamente.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id') id: string,
    @Body() updateItAssetsModelDto: UpdateItAssetsModelDto,
  ) {
    return this.itAssetsModelsService.update(id, updateItAssetsModelDto);
  }
}
