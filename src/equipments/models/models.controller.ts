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
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { FilterModelDto } from './dto/filter-model.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Models (Modelos)')
@ApiCookieAuth()
@Controller('models')
export class ModelsController {
  constructor(private readonly modelService: ModelsService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo modelo de hardware' })
  @ApiCreatedResponse({
    description: 'El modelo ha sido registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token de sesión inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createModelDto: CreateModelDto) {
    return this.modelService.create(createModelDto);
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
    summary: 'Obtener catálogo global de modelos con paginación y filtros',
  })
  @ApiOkResponse({
    description: 'Retorna la lista total de modelos registrados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAllModel(@Query() filterDto: FilterModelDto) {
    return this.modelService.findAll(filterDto);
  }

  @Get('brand/:brandId')
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
    summary: 'Obtener modelos específicos filtrados por el ID de una Marca',
  })
  @ApiParam({
    name: 'brandId',
    description: 'UUID de la marca para extraer sus modelos',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los modelos correspondientes a la marca dada.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findByBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Query() filterDto: FilterModelDto,
  ) {
    return this.modelService.findByBrand(brandId, filterDto);
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
    summary: 'Obtener los detalles de un modelo específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del modelo a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la información del modelo encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.modelService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar la información de un modelo existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del modelo a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El modelo ha sido actualizado de forma correcta.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateModelDto: UpdateModelDto,
  ) {
    return this.modelService.update(id, updateModelDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un modelo del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del modelo a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El modelo ha sido removido de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.modelService.remove(id);
  // }
}
