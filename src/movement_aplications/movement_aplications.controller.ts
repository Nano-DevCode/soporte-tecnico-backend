import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  Query,
  ParseIntPipe,
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
import { MovementAplicationsService } from './movement_aplications.service';
import { CreateMovementAplicationDto } from './dto/create-movement_aplication.dto';
import { UpdateMovementAplicationDto } from './dto/update-movement_aplication.dto';
import { FilterMovementAplicationDto } from './dto/filter-movement_aplication.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Movement Applications')
@ApiCookieAuth()
@Controller('movement-applications')
export class MovementAplicationsController {
  constructor(
    private readonly aplicationsService: MovementAplicationsService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary:
      'Registrar una nueva aplicación o destino para movimientos de almacén',
  })
  @ApiCreatedResponse({
    description: 'La aplicación de movimiento ha sido guardada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createDto: CreateMovementAplicationDto) {
    return this.aplicationsService.create(createDto);
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
      'Obtener el catálogo de aplicaciones de movimientos con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de destinos según los criterios de búsqueda establecidos.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterMovementAplicationDto) {
    return this.aplicationsService.findAll(filterDto);
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
    summary:
      'Obtener detalles de una aplicación de movimiento por su ID numérico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico autoincremental de la aplicación',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Retorna la información del destino solicitado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aplicationsService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Actualizar una aplicación de movimiento existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del registro a modificar',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'El registro ha sido modificado de forma correcta.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMovementAplicationDto,
  ) {
    return this.aplicationsService.update(id, updateDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({
  //   summary: 'Eliminar una aplicación de movimiento del catálogo',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico del registro a remover',
  //   type: 'number',
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description:
  //     'La aplicación ha sido eliminada de la base de datos de manera exitosa.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.aplicationsService.remove(id);
  // }
}
