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
import { TechnicalReportsService } from '../../technical-reports/technical-reports.service';
import { InterveneTicketDto } from '../dto/intervene-ticket.dto';
import { AttendsService } from 'src/attends/attends.service';
import { TagsService } from 'src/tags/tags.service';
import { Tag } from 'src/tags/entities/tag.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class InterveneTicketService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly technicalReportsService: TechnicalReportsService,
    private readonly attendService: AttendsService,
    private readonly tagsService: TagsService,
    private readonly i18n: I18nService,
  ) {}

  // * Registrar intervención técnica y evaluar estado del ticket.
  async interveneTicket(id: string, interveneTicketDto: InterveneTicketDto) {
    const { tags, issue_type, ...report } = interveneTicketDto;

    const ticket = await this.ticketService.findOneByIdOrFail(id);

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const eventToTrigger = report.is_resolved
      ? TicketEvent.SOLUCIONAR
      : TicketEvent.NO_SOLUCIONAR;
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      eventToTrigger,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let processedTicket: Ticket;
    try {
      processedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          await this.technicalReportsService.create(
            { ...report, ticketId: id },
            transactionManager,
          );

          await this.attendService.endAttention(id, transactionManager);

          await this.ticketHistory.createHistory(
            nextStatus,
            ticket,
            transactionManager,
            currentHistory,
          );

          let resolvedTags: Tag[] = [];
          if (tags && tags.length > 0) {
            const normalizedTagNames = tags.map((t) => t.trim().toUpperCase());

            const uniqueTagNames = [...new Set(normalizedTagNames)];

            resolvedTags = await this.tagsService.bulkFindOrCreate(
              uniqueTagNames,
              transactionManager,
            );
          }

          await transactionManager.save(Ticket, {
            id: ticket.id,
            version: ticket.version,
            updated_at: new Date(),
            tags: resolvedTags,
            ...(issue_type ? { issue_type: { id: issue_type } } : {}),
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
    const eventName = report.is_resolved ? 'ticket.solved' : 'ticket.no_solved';
    this.eventEmitter.emit(eventName, processedTicket);
    return processedTicket;
  }
}
