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
import { RejectionReportsService } from 'src/rejection-reports/rejection-reports.service';
import { RejectTicketDto } from '../dto/reject-ticket.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RejectTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly rejectionReportService: RejectionReportsService,
    private readonly i18n: I18nService,
  ) {}

  // * Rechazar solicitud
  async rejectTicket(id: string, rejectTicketDto: RejectTicketDto) {
    const ticket = await this.ticketService.findOneByIdOrFail(id);

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.RECHAZAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let rejectedTicket: Ticket;
    try {
      rejectedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          await this.rejectionReportService.create(
            { ...rejectTicketDto, ticketId: id },
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
    this.eventEmitter.emit('ticket.rejected', rejectedTicket);
    return rejectedTicket;
  }
}
