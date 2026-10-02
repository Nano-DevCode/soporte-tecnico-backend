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
import { TypenetworksService } from './typenetworks.service';
import { CreateTypenetworkDto } from './dto/create-typenetwork.dto';
import { UpdateTypenetworkDto } from './dto/update-typenetwork.dto';
import { FilterTypeNetworkDto } from './dto/filter-typenetwork.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Type Networks (Tipos de equipo de red)')
@ApiCookieAuth()
@Controller('typenetworks')
export class TypenetworksController {
  constructor(private readonly typenetworksService: TypenetworksService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de equipo de red' })
  @ApiCreatedResponse({
    description: 'El tipo de equipo de red ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createTypenetworkDto: CreateTypenetworkDto) {
    return this.typenetworksService.create(createTypenetworkDto);
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
    summary: 'Obtener el catálogo de tipos de red filtrado y paginado',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de red disponibles.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterTypeNetworkDto) {
    return this.typenetworksService.findAll(filterDto);
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
  @ApiOperation({ summary: 'Obtener un tipo de equipo de red por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de red a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de equipo de red encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.typenetworksService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de equipo de red existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de red a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de red ha sido modificado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTypenetworkDto: UpdateTypenetworkDto,
  ) {
    return this.typenetworksService.update(id, updateTypenetworkDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de equipo de red del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del tipo de red a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El registro ha sido removido de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.typenetworksService.remove(id);
  // }
}
