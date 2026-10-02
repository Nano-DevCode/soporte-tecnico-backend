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
import { ConsumableUbicationsService } from './consumable_ubications.service';
import { CreateConsumableUbicationDto } from './dto/create-consumable_ubication.dto';
import { UpdateConsumableUbicationDto } from './dto/update-consumable_ubication.dto';
import { FilterConsumableubicationDto } from './dto/filter-consumable_ubication.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Consumable Ubications (Ubicación de Almacenamiento de consumibles )')
@ApiCookieAuth()
@Controller('consumable-ubications')
export class ConsumableUbicationsController {
  constructor(
    private readonly consumableUbicationsService: ConsumableUbicationsService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar una nueva ubicación para consumibles' })
  @ApiCreatedResponse({
    description: 'La ubicación ha sido registrada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token ausente o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(@Body() createConsumableUbicationDto: CreateConsumableUbicationDto) {
    return this.consumableUbicationsService.create(
      createConsumableUbicationDto,
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
      'Obtener el catálogo de ubicaciones de consumibles con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de ubicaciones según los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterConsumableubicationDto) {
    return this.consumableUbicationsService.findAll(filterDto);
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
    summary: 'Obtener los detalles de una ubicación específica por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ubicación a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la información de la ubicación seleccionada.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consumableUbicationsService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Actualizar una ubicación de consumibles existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ubicación a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'La ubicación ha sido actualizada de forma exitosa.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConsumableUbicationDto: UpdateConsumableUbicationDto,
  ) {
    return this.consumableUbicationsService.update(
      id,
      updateConsumableUbicationDto,
    );
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({
  //   summary: 'Eliminar una ubicación de consumibles del sistema',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID de la ubicación a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'La ubicación ha sido eliminada correctamente.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.consumableUbicationsService.remove(id);
  // }
}
