import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ItAssetsInvoicesService } from '../services/it-assets-invoices.service';
import { CreateItAssetsInvoiceDto } from '../dto/create-it-assets-invoice.dto';
import { UpdateItAssetsInvoiceDto } from '../dto/update-it-assets-invoice.dto';
import { FilterItAssetsInvoiceDto } from '../dto/filter-it-assets-invoice.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
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

@ApiTags('IT Assets Invoices (Facturas)')
@ApiCookieAuth()
@Controller('it-assets-invoices')
export class ItAssetsInvoicesController {
  constructor(
    private readonly itAssetsInvoicesService: ItAssetsInvoicesService,
  ) {}

  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Registrar una nueva factura de activo TI' })
  @ApiCreatedResponse({
    description: 'La factura ha sido registrada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createItAssetsInvoiceDto: CreateItAssetsInvoiceDto) {
    return this.itAssetsInvoicesService.create(createItAssetsInvoiceDto);
  }

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary: 'Obtener la lista de facturas con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de facturas que coinciden con los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterItAssetsInvoiceDto) {
    return this.itAssetsInvoicesService.findAll(filterDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
  )
  @ApiOperation({ summary: 'Actualizar los datos de una factura existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la factura a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'La factura ha sido actualizada exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItAssetsInvoiceDto: UpdateItAssetsInvoiceDto,
  ) {
    return this.itAssetsInvoicesService.update(id, updateItAssetsInvoiceDto);
  }
}
