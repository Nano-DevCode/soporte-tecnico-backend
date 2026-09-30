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
import { TicketsService } from './tickets.service';
import { AttendsService } from 'src/attends/attends.service';
import { I18nService } from 'nestjs-i18n';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StartTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly attendService: AttendsService,
    private readonly i18n: I18nService,
  ) {}

  // * Iniciar atencion
  async startTicket(id: string, user: User) {
    const ticket = await this.ticketService.findOneByIdOrFail(id);
    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.ATENDER,
      this.i18n,
    );

    let startedTicket: Ticket;
    try {
      startedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          const nextStatus = await this.ticketHistory.findStatusByCodeOrFail(
            nextStatusCode,
            transactionManager,
          );

          await this.attendService.startAttention(id, user, transactionManager);

          await this.ticketHistory.createHistory(
            nextStatus,
            ticket,
            transactionManager,
            currentHistory,
          );

          await transactionManager.save(Ticket, {
            id: ticket.id,
            version: ticket.version,
            updated_at: new Date(),
          });

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

    this.eventEmitter.emit('ticket.started', startedTicket);
    return startedTicket;
  }
}
