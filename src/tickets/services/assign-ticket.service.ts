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
import { AssignTechnicsDto } from '../dto/assign-technics.dto';
import { AttendsService } from 'src/attends/attends.service';
import { TicketsService } from './tickets.service';
import { StaffService } from 'src/users/services/staff.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AssignTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly attendsService: AttendsService,
    private readonly ticketService: TicketsService,
    private readonly staffService: StaffService,
    private readonly i18n: I18nService,
  ) {}

  // * Asignar tecnicos
  async assignTechnicians(id: string, { technicianIds }: AssignTechnicsDto) {
    const technicians =
      await this.staffService.findAllTechnicalByIds(technicianIds);
    const ticket = await this.ticketService.findOneByIdOrFail(id);
    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.ASIGNAR,
      this.i18n,
    );

    let assignedTicket: Ticket;
    let hadChanges = false;
    try {
      assignedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          const attendResult =
            await this.attendsService.attendTicketWithEntities(
              ticket,
              technicians,
              transactionManager,
            );

          if (
            attendResult.inserted > 0 ||
            attendResult.deactivated > 0 ||
            (currentHistory.status.code as TicketStatus) ===
              TicketStatus.NO_SOLUCIONADA ||
            (currentHistory.status.code as TicketStatus) ===
              TicketStatus.CANALIZADA
          ) {
            hadChanges = true;

            const nextStatus = await this.ticketHistory.findStatusByCodeOrFail(
              nextStatusCode,
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
          }

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

    if (hadChanges) {
      this.eventEmitter.emit('ticket.assigned', assignedTicket);
    }
    return assignedTicket;
  }
}
