import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  Query,
  ParseUUIDPipe,
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
import { ResponsibleequipmentsService } from './responsibleequipments.service';
import { CreateResponsibleequipmentDto } from './dto/create-responsibleequipment.dto';
import { UpdateResponsibleequipmentDto } from './dto/update-responsibleequipment.dto';
import { FilterResponsibleEquipmentDto } from './dto/filter-responsibleequipment.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Responsible Equipments (Responsable de equipos)')
@ApiCookieAuth()
@Controller('responsibleequipments')
export class ResponsibleequipmentsController {
  constructor(
    private readonly responsibleequipmentsService: ResponsibleequipmentsService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Registrar un nuevo responsable de resguardo de equipos',
  })
  @ApiCreatedResponse({
    description: 'El responsable ha sido registrado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token ausente o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createResponsibleequipmentDto: CreateResponsibleequipmentDto) {
    return this.responsibleequipmentsService.create(
      createResponsibleequipmentDto,
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
      'Obtener el catálogo de personal responsable con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de personal responsable según los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterResponsibleEquipmentDto) {
    return this.responsibleequipmentsService.findAll(filterDto);
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
    summary: 'Obtener los detalles de un responsable específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del responsable a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la información y ficha del responsable seleccionado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.responsibleequipmentsService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar los datos de un responsable existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del responsable a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Los datos del responsable han sido actualizados de forma exitosa.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResponsibleequipmentDto: UpdateResponsibleequipmentDto,
  ) {
    return this.responsibleequipmentsService.update(
      id,
      updateResponsibleequipmentDto,
    );
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un responsable del sistema' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del responsable a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description:
  //     'El registro del responsable ha sido eliminado de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.responsibleequipmentsService.remove(id);
  // }
}
