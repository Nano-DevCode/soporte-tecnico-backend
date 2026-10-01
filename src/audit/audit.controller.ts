import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { AuditService } from './audit.service';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

@ApiTags('Auditoría y Trazabilidad (Audit Trail)')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Listar registros globales de auditoría',
    description:
      'Permite buscar y filtrar el historial de modificaciones del sistema con paginación, filtros por entidad, usuario y rango de fechas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registros de auditoría obtenidos exitosamente',
  })
  findAll(@Query() filterDto: FilterAuditLogsDto) {
    return this.auditService.findAll(filterDto);
  }

  @Get('entity/:entityName/:entityId')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Historial cronológico de cambios de una entidad específica',
    description:
      'Retorna la línea temporal completa de modificaciones que ha sufrido un registro puntual (ej. Ticket, Usuario, Equipo).',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de la entidad obtenido exitosamente',
  })
  findByEntity(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityName, entityId);
  }

  @Get(':id')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Consultar detalle de un registro de auditoría por UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del registro de auditoría',
  })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findById(id);
  }
}
