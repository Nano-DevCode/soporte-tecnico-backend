import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ToolsInvoicesService } from './tools-invoices.service';
import { CreateToolsInvoiceDto } from './dto/create-tools-invoice.dto';
import { UpdateToolsInvoiceDto } from './dto/update-tools-invoice.dto';
import { FilterToolsInvoiceDto } from './dto/filter-tools-invoice.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { ToolsInvoice } from './entities/tools-invoice.entity';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Tools Invoices (Facturas de Herramientas)')
@ApiCookieAuth() // Requiere autenticación
@Controller('tools-invoices')
export class ToolsInvoicesController {
  constructor(private readonly toolsInvoicesService: ToolsInvoicesService) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.jefecc,
  )
  @ApiOperation({ summary: 'Registrar una nueva factura de herramientas' })
  @ApiCreatedResponse({
    description: 'La factura ha sido registrada exitosamente.',
    type: ToolsInvoice,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createToolsInvoiceDto: CreateToolsInvoiceDto) {
    return this.toolsInvoicesService.create(createToolsInvoiceDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.jefecc,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener la lista de facturas con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de facturas que coinciden con los criterios de búsqueda.',
    type: [ToolsInvoice],
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll(@Query() filterDto: FilterToolsInvoiceDto) {
    return this.toolsInvoicesService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.jefecc,
  )
  @ApiOperation({ summary: 'Actualizar los datos de una factura existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la factura a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'La factura ha sido actualizada exitosamente.',
    type: ToolsInvoice,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id') id: string,
    @Body() updateToolsInvoiceDto: UpdateToolsInvoiceDto,
  ) {
    return this.toolsInvoicesService.update(id, updateToolsInvoiceDto);
  }
}
