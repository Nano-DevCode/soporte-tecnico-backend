import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { BatchesproductsService } from './batchesproducts.service';
import { CreateBatchesproductDto } from './dto/create-batchesproduct.dto';
import { FilterBatchesproductDto } from './dto/filter-batchesproduct.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Batches Products (Lotes de consumibles Entradas)')
@ApiCookieAuth()
@Controller('batches-products')
export class BatchesproductsController {
  constructor(private readonly batchService: BatchesproductsService) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary:
      'Registrar una nueva entrada o lote masivo de consumibles por requerimiento',
  })
  @ApiCreatedResponse({
    description:
      'El lote ha sido calculado, desglosado y guardado de forma exitosa.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token de sesión.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createDto: CreateBatchesproductDto) {
    return this.batchService.create(createDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary:
      'Obtener el inventario analítico de lotes registrados con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de lotes con stock activo o histórico según los filtros.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterBatchesproductDto) {
    return this.batchService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary:
      'Consultar detalles financieros y existencias de un lote específico',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del lote a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Retorna la información del lote solicitado junto con su stock remanente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchService.findOne(id);
  }
}
