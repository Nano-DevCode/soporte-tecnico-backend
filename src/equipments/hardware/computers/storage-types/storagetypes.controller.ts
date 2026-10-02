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
import { StoragetypesService } from './storagetypes.service';
import { CreateStoragetypeDto } from './dto/create-storagetype.dto';
import { UpdateStoragetypeDto } from './dto/update-storagetype.dto';
import { FilterStorageTypeDto } from './dto/filter-storagetype.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Storage Types (Tipos de almacenamiento)')
@ApiCookieAuth()
@Controller('storagetypes')
export class StoragetypesController {
  constructor(private readonly storagetypesService: StoragetypesService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de almacenamiento' })
  @ApiCreatedResponse({
    description: 'El tipo de almacenamiento ha sido registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token de acceso.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createStoragetypeDto: CreateStoragetypeDto) {
    return this.storagetypesService.create(createStoragetypeDto);
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
      'Obtener el catálogo de tipos de almacenamiento filtrado y paginado',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de almacenamiento.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterStorageTypeDto) {
    return this.storagetypesService.findAll(filterDto);
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
    summary: 'Obtener un tipo de almacenamiento específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de almacenamiento a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de almacenamiento encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storagetypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de almacenamiento existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de almacenamiento a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de almacenamiento ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoragetypeDto: UpdateStoragetypeDto,
  ) {
    return this.storagetypesService.update(id, updateStoragetypeDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de almacenamiento' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del tipo de almacenamiento a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description:
  //     'El tipo de almacenamiento ha sido eliminado de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere el rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.storagetypesService.remove(id);
  // }
}
