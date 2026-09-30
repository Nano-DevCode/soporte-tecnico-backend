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
import { ComputerequipmenttypesService } from './computerequipmenttypes.service';
import { CreateComputerequipmenttypeDto } from './dto/create-computerequipmenttype.dto';
import { UpdateComputerequipmenttypeDto } from './dto/update-computerequipmenttype.dto';
import { FilterComputerequipmenttypeDto } from './dto/filter-computerequipmenttype.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Computer Equipment Types (Tipo de equipo de cómputo)')
@ApiCookieAuth()
@Controller('computerequipmenttypes')
export class ComputerequipmenttypesController {
  constructor(
    private readonly computerequipmenttypesService: ComputerequipmenttypesService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de equipo de cómputo' })
  @ApiCreatedResponse({
    description: 'El tipo de equipo de cómputo ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token o la sesión expiró.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(
    @Body() createComputerequipmenttypeDto: CreateComputerequipmenttypeDto,
  ) {
    return this.computerequipmenttypesService.create(
      createComputerequipmenttypeDto,
    );
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
      'Obtener el catálogo de tipos de equipo de cómputo filtrado y paginado',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de equipo de cómputo configurados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterComputerequipmenttypeDto) {
    return this.computerequipmenttypesService.findAll(filterDto);
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
    summary: 'Obtener un tipo de equipo de cómputo específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de equipo a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de equipo encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.computerequipmenttypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Actualizar un tipo de equipo de cómputo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de equipo a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de equipo ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComputerequipmenttypeDto: UpdateComputerequipmenttypeDto,
  ) {
    return this.computerequipmenttypesService.update(
      id,
      updateComputerequipmenttypeDto,
    );
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de equipo de cómputo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del tipo de equipo a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El tipo de equipo ha sido eliminado exitosamente.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.computerequipmenttypesService.remove(id);
  // }
}
