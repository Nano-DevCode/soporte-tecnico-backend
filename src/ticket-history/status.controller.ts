import { Controller, Get, UseFilters } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Status } from './entities';

@ApiTags('Status')
@ApiCookieAuth()
@UseFilters(DbexceptionFilter)
@Controller('status')
export class StatusController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener estados de tickets',
    description:
      'Recupera un listado completo de todos los estados disponibles en el sistema para la gestión y clasificación de los tickets.',
  })
  @ApiOkResponse({
    description: 'Listado de estados recuperado exitosamente.',
    type: Status,
  })
  @ApiInternalServerErrorResponse({
    description:
      'Error interno del servidor al procesar la consulta a la base de datos.',
  })
  findAll() {
    return this.ticketHistoryService.findAllStatus();
  }
}
