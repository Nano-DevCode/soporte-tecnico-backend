import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  ParseIntPipe,
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
import { MovementTypesService } from './movement_types.service';
import { CreateMovementTypeDto } from './dto/create-movement_type.dto';
import { UpdateMovementTypeDto } from './dto/update-movement_type.dto';
import { FilterMovementTypeDto } from './dto/filter-movement_type.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Movement Types')
@ApiCookieAuth()
@Controller('movement-types')
export class MovementTypesController {
  constructor(private readonly movementTypesService: MovementTypesService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Registrar un nuevo tipo o concepto de movimiento de almacén',
  })
  @ApiCreatedResponse({
    description: 'El tipo de movimiento ha sido registrado de forma exitosa.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token de sesión inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createMovementTypeDto: CreateMovementTypeDto) {
    return this.movementTypesService.create(createMovementTypeDto);
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
      'Obtener el catálogo de tipos de movimientos con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de conceptos de movimientos según las condiciones de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterMovementTypeDto) {
    return this.movementTypesService.findAll(filterDto);
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
    summary: 'Obtener detalles de un tipo de movimiento por su ID numérico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico autoincremental del concepto',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Retorna la información del tipo de movimiento solicitado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movementTypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de movimiento existente' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del concepto a modificar',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'El registro del concepto ha sido modificado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovementTypeDto: UpdateMovementTypeDto,
  ) {
    return this.movementTypesService.update(id, updateMovementTypeDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de movimiento del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico del registro a remover',
  //   type: 'number',
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description:
  //     'El concepto de movimiento ha sido eliminado de la base de datos de forma exitosa.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.movementTypesService.remove(id);
  // }
}
