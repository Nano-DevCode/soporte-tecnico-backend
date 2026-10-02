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
  HttpCode,
  HttpStatus,
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
import { UnitMeasurementService } from './unit-measurement.service';
import { CreateUnitMeasurementDto } from './dto/create-unit-measurement.dto';
import { UpdateUnitMeasurementDto } from './dto/update-unit-measurement.dto';
import { FilterUnitmeasurementDto } from './dto/filter-unit-measurement.dto';
import { UnitMeasurement } from './entities/unit-measurement.entity';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Unit Measurements (Unidades de medida (Unitario, Fraccionario))')
@ApiCookieAuth()
@Controller('unit-measurements')
export class UnitMeasurementController {
  constructor(
    private readonly unitMeasurementService: UnitMeasurementService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una nueva unidad de medida en el catálogo base',
  })
  @ApiCreatedResponse({
    description: 'La unidad de medida ha sido creada exitosamente.',
    type: UnitMeasurement,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere un token de sesión válido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(
    @Body() createUnitMeasurementDto: CreateUnitMeasurementDto,
  ): Promise<UnitMeasurement> {
    return this.unitMeasurementService.create(createUnitMeasurementDto);
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
      'Obtener el listado de unidades de medida con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna un arreglo con las unidades de medida que cumplen las condiciones solicitadas.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterUnitmeasurementDto: FilterUnitmeasurementDto) {
    return this.unitMeasurementService.findAll(filterUnitmeasurementDto);
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
    summary: 'Obtener los detalles de una unidad de medida por su ID numérico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico autoincremental de la unidad de medida',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Retorna la información de la unidad de medida solicitada.',
    type: UnitMeasurement,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitMeasurement> {
    return this.unitMeasurementService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar una unidad de medida existente' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del registro a modificar',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Los datos de la unidad han sido actualizados de forma correcta.',
    type: UnitMeasurement,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitMeasurementDto: UpdateUnitMeasurementDto,
  ): Promise<UnitMeasurement> {
    return this.unitMeasurementService.update(id, updateUnitMeasurementDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar una unidad de medida del sistema' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico de la unidad a remover',
  //   type: 'number',
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description:
  //     'La unidad de medida ha sido eliminada del repositorio institucional.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere el rol de superAdmin.',
  // })
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.unitMeasurementService.remove(id);
  // }
}
