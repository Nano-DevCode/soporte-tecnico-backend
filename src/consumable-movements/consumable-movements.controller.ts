import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConsumableMovementsService } from './consumable-movements.service';
import { CreateConsumableMovementDto } from './dto/create-consumable-movement.dto';
import { FilterConsumablemovementDto } from './dto/filter-consumable-movement.dto';
import { ConsumableMovement } from './entities/consumable-movement.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Consumable Movements (Movimientos de consumibles Entrada- Salida)')
@ApiCookieAuth()
@Controller('consumable-movements')
export class ConsumableMovementsController {
  constructor(
    private readonly consumableMovementsService: ConsumableMovementsService,
  ) {}

  /**
   * REGISTRAR UNA NUEVA SALIDA DE CONSUMIBLES (MÉTODO PEPS)
   */
  @Post('output')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registrar una nueva salida o consumo físico de insumos utilizando el método PEPS/FIFO',
  })
  @ApiOkResponse({
    description:
      'La transacción ha sido procesada, rebajando el stock de los lotes correspondientes.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requieren permisos de gestión de inventario.',
  })
  registerOutput(@Body() createDto: CreateConsumableMovementDto) {
    return this.consumableMovementsService.registerOutput(createDto);
  }

  /**
   * LISTAR TODOS LOS MOVIMIENTOS CON FILTROS Y PAGINACIÓN
   */
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
      'Consultar el historial analítico de movimientos (Entradas/Salidas) con filtros',
  })
  @ApiOkResponse({
    description: 'Retorna el listado de transacciones cronológicas de almacén.',
    type: [ConsumableMovement],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterConsumablemovementDto) {
    return this.consumableMovementsService.findAll(filterDto);
  }

  /**
   * OBTENER EL DETALLE DE UN MOVIMIENTO ESPECÍFICO POR SU ID
   */
  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Consultar la ficha detallada de un movimiento de almacén',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del movimiento a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna la entidad completa del movimiento solicitado.',
    type: ConsumableMovement,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOneMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.consumableMovementsService.findOneMovement(id);
  }

  /**
   * OBTENER RESUMEN MONETARIO Y DESGLOSE POR CÓDIGO DE CONTROL
   */
  @Get('summary/:code')
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
      'Obtener balance y desglose de costos asociados a un Ticket o Código Progresivo',
  })
  @ApiParam({
    name: 'code',
    description: 'Código único o folio de control del movimiento/ticket',
    type: 'string',
    example: 'CC-OUT-0045',
  })
  @ApiOkResponse({
    description:
      'Retorna un resumen estructurado con los costos globales recalculados del folio.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findSummaryByCode(@Param('code') code: string) {
    const sanitizedCode = code.trim().replace(/\s+/g, ' ');
    return this.consumableMovementsService.findSummaryByCode(sanitizedCode);
  }
}
