import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { StaffService } from 'src/users/services/staff.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';

export interface NotificationMessages {
  creatorMsg?: string;
  coordinatorMsg?: string;
  technicianMsg?: string;
  planningMsg?: string;
  ccBossMsg?: string;
  commonMsg?: string;
}

@Injectable()
export class SystemNotificationService {
  private readonly logger = new Logger(SystemNotificationService.name);

  constructor(
    private readonly staffService: StaffService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async broadcastSystemNotification(
    ticket: Ticket,
    title: string,
    messages: NotificationMessages,
    type: NotificationType,
  ) {
    if (messages.creatorMsg && ticket.jefe_depto?.user?.id) {
      this.eventEmitter.emit('notification.send', {
        userId: ticket.jefe_depto.user.id,
        title,
        message: messages.creatorMsg,
        type,
        entityId: ticket.id,
      });
    }

    if (messages.coordinatorMsg && ticket.coordinator?.user?.id) {
      this.eventEmitter.emit('notification.send', {
        userId: ticket.coordinator.user.id,
        title,
        message: messages.coordinatorMsg,
        type,
        entityId: ticket.id,
      });
    }

    if (messages.technicianMsg && ticket.attends) {
      ticket.attends.forEach((attend) => {
        if (attend.technician?.user?.id) {
          this.eventEmitter.emit('notification.send', {
            userId: attend.technician.user.id,
            title,
            message: messages.technicianMsg!,
            type,
            entityId: ticket.id,
          });
        }
      });
    }

    if (messages.planningMsg) {
      try {
        const planningBosses =
          await this.staffService.findAllPlaningBossContact();
        planningBosses.forEach((boss) => {
          if (boss.user?.id) {
            this.eventEmitter.emit('notification.send', {
              userId: boss.user.id,
              title,
              message: messages.planningMsg!,
              type,
              entityId: ticket.id,
            });
          }
        });
      } catch (error) {
        this.logger.error('Error fetching planning bosses', error);
      }
    }

    if (messages.ccBossMsg) {
      try {
        const ccBosses = await this.staffService.findAllBossCCContact();
        ccBosses.forEach((boss) => {
          if (boss.user?.id) {
            this.eventEmitter.emit('notification.send', {
              userId: boss.user.id,
              title,
              message: messages.ccBossMsg!,
              type,
              entityId: ticket.id,
            });
          }
        });
      } catch (error) {
        this.logger.error('Error fetching cc bosses', error);
      }
    }

    if (messages.commonMsg) {
      try {
        const users = await this.staffService.findAllUserForNotification();
        users.forEach((u) => {
          if (u.user?.id) {
            this.eventEmitter.emit('notification.send', {
              userId: u.user.id,
              title,
              message: messages.commonMsg!,
              type,
              entityId: ticket.id,
            });
          }
        });
      } catch (error) {
        this.logger.error(
          'Error fetching common users for notification',
          error,
        );
      }
    }
  }

  @OnEvent('ticket.created', { async: true })
  async handleTicketCreatedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Creado',
      {
        creatorMsg: `Tu solicitud de soporte técnico (Folio: ${ticket.folio}) ha sido registrada correctamente.`,
        ccBossMsg: `El ticket ${ticket.folio} ha sido creado y requiere canalización.`,
        // planningMsg: `Se ha registrado el nuevo ticket ${ticket.folio} en el sistema.`,
        commonMsg: `Se ha creado el ticket ${ticket.folio} en el sistema.`,
      },
      NotificationType.TICKET_CREATED,
    );
  }

  @OnEvent('ticket.edited', { async: true })
  async handleTicketEditedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Actualizado',
      {
        creatorMsg: `Tu ticket ${ticket.folio} ha sido actualizado.`,
        ccBossMsg: `El ticket ${ticket.folio} ha sido actualizado.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido actualizado.`,
        coordinatorMsg: `El ticket ${ticket.folio} ha sido actualizado.`,
        commonMsg: `El ticket ${ticket.folio} ha sido actualizado.`,
      },
      NotificationType.TICKET_UPDATED,
    );
  }

  @OnEvent('ticket.rejected', { async: true })
  async handleTicketRejectedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Rechazado',
      {
        creatorMsg: `Lamentamos informarte que el ticket ${ticket.folio} ha sido rechazado.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido rechazado.`,
        commonMsg: `El ticket ${ticket.folio} ha sido rechazado.`,
      },
      NotificationType.TICKET_REJECTED,
    );
  }

  @OnEvent('ticket.routed', { async: true })
  async handleTicketRoutedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Canalizado',
      {
        coordinatorMsg: `Te ha sido canalizado el ticket ${ticket.folio} para su asignación.`,
        creatorMsg: `Tu ticket ${ticket.folio} ha sido canalizado a un coordinador.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido canalizado.`,
        commonMsg: `El ticket ${ticket.folio} ha sido canalizado a un coordinador.`,
      },
      NotificationType.TICKET_ROUTED,
    );
  }

  @OnEvent('ticket.assigned', { async: true })
  async handleTicketAssignedSystem(ticket: Ticket) {
    if (!ticket || !ticket.attends) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Asignado',
      {
        technicianMsg: `Se te ha asignado el ticket ${ticket.folio} del departamento ${ticket.jefe_depto?.department?.name || 'No especificado'}.`,
        creatorMsg: `Tu ticket ${ticket.folio} ha sido asignado a un técnico para su revisión.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido asignado a un técnico.`,
        commonMsg: `El ticket ${ticket.folio} ha sido asignado a un técnico.`,
      },
      NotificationType.TICKET_ASSIGNED,
    );
  }

  @OnEvent('ticket.started', { async: true })
  async handleTicketStartedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Atención Iniciada',
      {
        creatorMsg: `El personal técnico ha comenzado a trabajar en tu ticket ${ticket.folio}.`,
        coordinatorMsg: `El técnico ha iniciado la atención del ticket ${ticket.folio}.`,
        // planningMsg: `Se ha iniciado la atención del ticket ${ticket.folio}.`,
        commonMsg: `Se ha iniciado la atención del ticket ${ticket.folio}.`,
      },
      NotificationType.TICKET_IN_PROGRESS,
    );
  }

  @OnEvent('ticket.solved', { async: true })
  async handleTicketSolvedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Resuelto',
      {
        creatorMsg: `Tu ticket ${ticket.folio} ha sido marcado como resuelto por el técnico. Por favor, confirma en el sistema.`,
        coordinatorMsg: `El ticket ${ticket.folio} ha sido resuelto por el técnico.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido resuelto.`,
        commonMsg: `El ticket ${ticket.folio} ha sido marcado como resuelto.`,
      },
      NotificationType.TICKET_SOLVED,
    );
  }

  @OnEvent('ticket.no_solved', { async: true })
  async handleTicketNoSolvedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket No Resuelto',
      {
        creatorMsg: `El técnico ha marcado tu ticket ${ticket.folio} como no resuelto. Un coordinador lo revisará pronto.`,
        coordinatorMsg: `El ticket ${ticket.folio} no pudo ser resuelto por el técnico.`,
        // planningMsg: `El ticket ${ticket.folio} ha sido marcado como no resuelto.`,
        commonMsg: `El ticket ${ticket.folio} ha sido marcado como no resuelto.`,
      },
      NotificationType.TICKET_NOT_SOLVED,
    );
  }

  @OnEvent('ticket.finished', { async: true })
  async handleTicketFinishedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Finalizado',
      {
        creatorMsg: `Tu ticket ${ticket.folio} ha sido finalizado.`,
        coordinatorMsg: `El usuario ha confirmado la finalización del ticket ${ticket.folio}.`,
        // planningMsg: `El ticket ${ticket.folio} ha finalizado su ciclo de atención.`,
        commonMsg: `El ticket ${ticket.folio} ha finalizado su ciclo de atención.`,
      },
      NotificationType.TICKET_FINISHED,
    );
  }

  @OnEvent('ticket.closed', { async: true })
  async handleTicketClosedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Solicitud Cerrada',
      {
        creatorMsg: `Tu solicitud ${ticket.folio} ha sido cerrada.`,
        coordinatorMsg: `El ticket ${ticket.folio} ha sido cerrado.`,
        planningMsg: `El ticket ${ticket.folio} ha sido cerrado y requiere confirmación de archivo.`,
        commonMsg: `El ticket ${ticket.folio} ha sido cerrado.`,
      },
      NotificationType.TICKET_CLOSED,
    );
  }

  @OnEvent('ticket.archived', { async: true })
  async handleTicketArchivedSystem(ticket: Ticket) {
    if (!ticket) return;
    await this.broadcastSystemNotification(
      ticket,
      'Ticket Archivado',
      {
        creatorMsg: `Tu ticket ${ticket.folio} ha sido archivado exitosamente.`,
        coordinatorMsg: `El ticket ${ticket.folio} ha sido archivado por Planeación.`,
        commonMsg: `El ticket ${ticket.folio} ha sido archivado.`,
      },
      NotificationType.TICKET_UPDATED,
    );
  }
}
