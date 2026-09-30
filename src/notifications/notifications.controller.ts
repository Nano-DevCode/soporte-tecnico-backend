import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiCookieAuth()
@Controller('notifications')
@Auth() // Requiere autenticación para todas las rutas
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario logueado' })
  @ApiOkResponse({ description: 'Retorna listado paginado de notificaciones.' })
  findAll(
    @GetUser('id') userId: string,
    @Query() paginationDto: PaginationWithPageDto,
  ) {
    return this.notificationsService.findAll(userId, paginationDto);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  @ApiOkResponse({
    description: 'Retorna el total de notificaciones sin leer.',
  })
  getUnreadCount(@GetUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Marcar todas las notificaciones del usuario como leídas',
  })
  @ApiOkResponse({
    description: 'Todas las notificaciones fueron marcadas como leídas.',
  })
  markAllAsRead(@GetUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación específica como leída' })
  @ApiOkResponse({
    description: 'Notificación marcada como leída exitosamente.',
  })
  markAsRead(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }
}
