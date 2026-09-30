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
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { PauseReportsService } from 'src/pause-reports/pause-reports.service';
import { PauseTicketDto } from '../dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class PauseTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly folioCounterService: FolioCountersService,
    private readonly pauseReportsService: PauseReportsService,
    private readonly i18n: I18nService,
  ) {}

  // * Pausar un ticket.
  async pauseTicket(id: string, pauseTicketDto: PauseTicketDto) {
    const ticket = await this.ticketService.findOneByIdOrFail(id);

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.PAUSAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let pausedTicket: Ticket;
    try {
      pausedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          if (!ticket.internal_folio) {
            ticket.internal_folio =
              await this.folioCounterService.generateNewFolio(
                ticket.jefe_depto.department.acronym,
                transactionManager,
              );
          }

          await this.pauseReportsService.create(
            { ...pauseTicketDto, ticketId: id },
            transactionManager,
          );

          await this.ticketHistory.createHistory(
            nextStatus,
            ticket,
            transactionManager,
            currentHistory,
          );

          await transactionManager.save(Ticket, {
            id: ticket.id,
            version: ticket.version,
            internal_folio: ticket.internal_folio,
            updated_at: new Date(),
          });

          const reloadedTicket = await this.ticketService.findOneByIdOrFail(
            id,
            transactionManager,
          );

          return reloadedTicket;
        },
      );
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'El ticket fue modificado por otro usuario mientras usted lo tenía abierto. Por favor, recargue la página para ver los datos más recientes.',
        );
      }
      throw error;
    }
    this.eventEmitter.emit('ticket.paused', pausedTicket);
    return pausedTicket;
  }
}
