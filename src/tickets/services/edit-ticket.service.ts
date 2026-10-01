import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TicketEvent,
  TicketStatus,
  transition,
} from 'src/common/machine/TicketStateMachine.machine';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { UpdateTicketDto } from '../dto';
import { TicketsService } from './tickets.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Document } from 'src/documents/entities/document.entity';
import { I18nService } from 'nestjs-i18n';
import { IPdfResult } from 'src/common/interfaces/interface';

@Injectable()
export class EditTicketService {
  private readonly logger = new Logger('EditTicketService');

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly responsePdfsService: PdfsService,
    private readonly i18n: I18nService,
  ) {}

  // * Editar informacion del ticket
  async editTicket(
    id: string,
    { issue_type, ...updateTicketDto }: UpdateTicketDto,
  ) {
    const ticket = await this.ticketService.findOneByIdOrFail(id);
    const currentHistory = this.ticketService.getCurrentHistory(ticket);

    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.CORREGIR,
      this.i18n,
    );

    let editedTicket: Ticket;
    try {
      editedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          const nextStatus = await this.ticketHistory.findStatusByCodeOrFail(
            nextStatusCode,
            transactionManager,
          );

          const updatePayload: DeepPartial<Ticket> = {
            id: ticket.id,
            version: ticket.version,
            updated_at: new Date(),
            ...updateTicketDto,
            ...(issue_type && { issue_type: { id: issue_type } }),
          };

          await transactionManager.save(Ticket, updatePayload);

          await this.ticketHistory.createHistory(
            nextStatus,
            ticket,
            transactionManager,
            currentHistory,
          );

          const reloadedTicket =
            await this.ticketService.findOneByIdWithDetailsOrFail(
              id,
              transactionManager,
            );

          let pdfResult: IPdfResult;
          try {
            pdfResult =
              await this.responsePdfsService.pdfRequestBucket(reloadedTicket);
          } catch (error) {
            this.logger.error('Error regenerando el PDF al editar:', error);
            throw new ServiceUnavailableException(
              this.i18n.t('errors.tickets.pdf_generation_failed'),
            );
          }

          const existingDocument = await transactionManager.findOne(Document, {
            where: {
              ticket: { id: reloadedTicket.id },
              type_document: { id: 1 },
            },
          });

          if (existingDocument) {
            existingDocument.name = pdfResult.fileName;
            existingDocument.url = pdfResult.url;
            await transactionManager.save(Document, existingDocument);
          } else {
            const newDocument = transactionManager.create(Document, {
              name: pdfResult.fileName,
              url: pdfResult.url,
              ticket: reloadedTicket,
              type_document: { id: 1 },
            });
            await transactionManager.save(Document, newDocument);
          }

          return await this.ticketService.findOneByIdWithDetailsOrFail(
            id,
            transactionManager,
          );
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

    this.eventEmitter.emit('ticket.edited', editedTicket);
    return editedTicket;
  }
}
