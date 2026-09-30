import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
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
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Equipments (Equipos de cómputo/red/impresoras)')
@ApiCookieAuth()
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
  )
  @ApiOperation({
    summary:
      'Registrar un nuevo activo de hardware con especificaciones anidadas opcionales',
  })
  @ApiCreatedResponse({
    description:
      'El equipo global y sus especificaciones técnicas se crearon exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Rol insuficiente para registrar activos.',
  })
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentsService.create(createEquipmentDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
    ValidRole.inventory,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary:
      'Consultar inventario global de equipos con paginación avanzada y filtros cruzados',
  })
  @ApiOkResponse({
    description:
      'Retorna un arreglo con los activos de hardware que cumplen los filtros.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  async findAll(@Query() filterDto: FilterEquipmentDto) {
    return this.equipmentsService.findAll(filterDto);
  }

  @Get('type/:category/:typeId')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
    ValidRole.inventory,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary:
      'Filtrar activos específicamente por categoría de hardware e ID de sub-catálogo',
  })
  @ApiParam({
    name: 'category',
    description: 'Categoría raíz del hardware',
    example: 'computers',
    enum: ['computers', 'printers', 'networks'],
  })
  @ApiParam({
    name: 'typeId',
    description: 'ID numérico del tipo específico de equipo',
    example: 1,
    type: 'number',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de activos segmentados por el tipo y categoría seleccionado.',
  })
  async findByType(
    @Param('typeId', ParseIntPipe) typeId: number,
    @Param('category') category: string,
    @Query() filterDto: FilterEquipmentDto,
  ) {
    return this.equipmentsService.findByType(typeId, category, filterDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Obtener la ficha completa de un equipo por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del equipo de cómputo/red/impresora',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Retorna toda la información del activo y sus relaciones anidadas.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentsService.findOne(id);
  }

  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
  )
  @ApiOperation({
    summary: 'Modificar los datos generales o técnicos de un activo',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del equipo a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El equipo ha sido modificado y sincronizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentsService.update(id, updateEquipmentDto);
  }

  @Patch(':id/deactivate')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
  )
  @ApiOperation({ summary: 'Desactivar lógicamente un equipo (Baja temporal)' })
  @ApiParam({
    name: 'id',
    description: 'UUID del activo a dar de baja lógicamente',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'El estado del equipo cambió exitosamente a inactivo (status: false).',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentsService.deactivate(id);
  }

  @Patch(':id/activate')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.secretaria,
    ValidRole.jefe,
  )
  @ApiOperation({ summary: 'Reactivar lógicamente un equipo dado de baja' })
  @ApiParam({
    name: 'id',
    description: 'UUID del activo a dar de alta lógicamente',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'El estado del equipo cambió exitosamente a activo (status: true).',
  })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentsService.activate(id);
  }

  // // no se ocupa el metodo solo activamos y desactivamos el equipo
  // @Delete(':id')
  // @ApiOperation({
  //   summary:
  //     'Eliminar físicamente un equipo del sistema (Rompe en cascada especificaciones)',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del registro a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description:
  //     'El equipo y sus especificaciones técnicas asociadas fueron eliminadas.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.equipmentsService.remove(id);
  // }
}
