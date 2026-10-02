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
import { EquipmenttypesService } from './equipmenttypes.service';
import { CreateEquipmenttypeDto } from './dto/create-equipmenttype.dto';
import { UpdateEquipmenttypeDto } from './dto/update-equipmenttype.dto';
import { FilterEquipmenttypeDto } from './dto/filter-equipmenttype.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Equipment Types (Tipo de equipo)')
@ApiCookieAuth()
@Controller('equipmenttypes')
export class EquipmenttypesController {
  constructor(private readonly equipmenttypesService: EquipmenttypesService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de equipo global' })
  @ApiCreatedResponse({
    description: 'La categoría de equipo ha sido registrada de forma exitosa.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token o la sesión expiró.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createEquipmenttypeDto: CreateEquipmenttypeDto) {
    return this.equipmenttypesService.create(createEquipmenttypeDto);
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
      'Obtener el catálogo general de tipos de equipo con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de tipos de equipo configurados en el sistema.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterEquipmenttypeDto) {
    return this.equipmenttypesService.findAll(filterDto);
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
    summary: 'Obtener un tipo de equipo global por su ID numérico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico correlativo del tipo de equipo',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de equipo solicitado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmenttypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de equipo global existente' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico correlativo del tipo de equipo a modificar',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'El registro ha sido actualizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmenttypeDto: UpdateEquipmenttypeDto,
  ) {
    return this.equipmenttypesService.update(id, updateEquipmenttypeDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de equipo global' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico correlativo del tipo de equipo a eliminar',
  //   type: 'number',
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description: 'El tipo de equipo ha sido eliminado de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Requiere privilegios de superAdmin.',
  // })
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.equipmenttypesService.remove(id);
  // }
}
