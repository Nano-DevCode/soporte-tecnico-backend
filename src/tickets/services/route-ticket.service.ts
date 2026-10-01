import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TicketEvent,
  TicketStatus,
  transition,
} from 'src/common/machine/TicketStateMachine.machine';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { RouteTicketDto } from '../dto/route-ticket.dto';
import { TicketsService } from './tickets.service';
import { StaffService } from 'src/users/services/staff.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RouteTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly staffService: StaffService,
    private readonly i18n: I18nService,
  ) {}

  // * Canalizar solicitud
  async routeTicket(id: string, { coordinatorId, priority }: RouteTicketDto) {
    const ticket = await this.ticketService.findOneByIdOrFail(id);
    const coordinator = await this.staffService.findOne(coordinatorId);

    if (ticket.coordinator?.id === coordinatorId) {
      throw new ConflictException(this.i18n.t('errors.tickets.already_routed'));
    }

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.CANALIZAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let routedTicket: Ticket;
    try {
      routedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          ticket.coordinator = coordinator;
          ticket.priority = priority || ticket.priority;
          const savedTicket = await transactionManager.save(ticket);

          await this.ticketHistory.createHistory(
            nextStatus,
            savedTicket,
            transactionManager,
            currentHistory,
          );

          const reloadedTicket =
            await this.ticketService.findOneByIdWithDetailsOrFail(
              id,
              transactionManager,
            );

          return reloadedTicket;
        },
      );
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          this.i18n.t('errors.tickets.version_mismatch'),
        );
      }
      throw error;
    }
    this.eventEmitter.emit('ticket.routed', routedTicket);
    return routedTicket;
  }
}
