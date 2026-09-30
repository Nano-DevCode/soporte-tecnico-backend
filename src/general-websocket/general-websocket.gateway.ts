import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { GeneralWebsocketService } from './general-websocket.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

@ApiTags('WebSockets')
@ApiCookieAuth()
@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  namespace: 'realtime',
})
export class GeneralWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server | undefined;

  private readonly logger = new Logger(GeneralWebsocketGateway.name);

  constructor(
    private readonly generalWebsocketService: GeneralWebsocketService,
  ) {}

  @ApiOperation({
    summary: 'Conexión al namespace realtime',
    description:
      'Establece una conexión persistente. Requiere el token de autenticación en las cookies. El cliente será unido automáticamente a la sala user_{userId}.',
  })
  async handleConnection(client: Socket) {
    try {
      const { userId, staffId, roomToJoin } =
        await this.generalWebsocketService.authenticateClient(
          client.handshake.headers.cookie,
        );

      const roomsToJoin = [`user_${userId}`];

      if (staffId) {
        roomsToJoin.push(`staff_${staffId}`);
      }

      if (roomToJoin && roomToJoin.length > 0) {
        roomsToJoin.push(...roomToJoin);
      }

      await client.join(roomsToJoin);

      this.logger.log(
        `Cliente autenticado: ${client.id} (User: ${userId}, Rooms: ${roomsToJoin.join(',')})`,
      );
    } catch (error) {
      this.logger.warn(`Conexión rechazada [${client.id}]: ${error}`);
      client.emit('auth_error', { message: 'Token inválido o expirado' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @OnEvent('ticket.*', { async: true })
  handleTicketUpdates(ticket: Ticket) {
    if (!ticket || !ticket.id) return;
    this.notifyRelevantRooms(ticket);
  }

  private notifyRelevantRooms(ticket: Ticket) {
    const targetRooms = new Set<string>();

    targetRooms.add('all_current_tickets');

    if (ticket.jefe_depto?.id) {
      targetRooms.add(`staff_${ticket.jefe_depto.id}`);
    }

    if (ticket.coordinator?.id) {
      targetRooms.add(`staff_${ticket.coordinator.id}`);
    }

    if (ticket.attends && ticket.attends.length > 0) {
      ticket.attends.forEach((attend) => {
        if (attend.technician?.id) {
          targetRooms.add(`staff_${attend.technician.id}`);
        }
      });
    }

    this.server?.to(Array.from(targetRooms)).emit('ticket_updated', ticket.id);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server?.to(`user_${userId}`).emit(event, payload);
  }
}
