import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
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
import { ResponseSignatureService } from '../../response-signature/response-signature.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { SignatureRole } from 'src/response-signature/entities/response-signature.entity';
import { ResponsesService } from '../../responses/responses.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Document } from 'src/documents/entities/document.entity';
import { I18nService } from 'nestjs-i18n';
import { IPdfResult } from 'src/common/interfaces/interface';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@Injectable()
export class ArchiveTicketService {
  private readonly logger = new Logger('ArchiveTicketService');

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly responseSignatureService: ResponseSignatureService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ResponsesService))
    private readonly responsesService: ResponsesService,
    private readonly responsePdfsService: PdfsService,
    private readonly i18n: I18nService,
  ) {}

  // * Archive un ticket.
  async archiveTicket(id: string, user: User) {
    const { staff: jefePlaneacion, role } = await this.usersService.findOne(
      user.id,
    );
    let ticket = await this.ticketService.findOneByIdOrFail(id);

    if (!jefePlaneacion || (role?.name as ValidRole) !== ValidRole.planning) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.no_planning_profile'),
      );
    }

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.ARCHIVAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let archivedTicket: Ticket;
    try {
      archivedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          ticket.updated_at = new Date();
          ticket = await transactionManager.save(Ticket, ticket);

          const response = await this.responsesService.findByTicketIdOrFail(
            id,
            transactionManager,
          );

          await this.responseSignatureService.signResponse(
            response,
            jefePlaneacion.rfc,
            SignatureRole.PLANEACION,
            transactionManager,
          );

          await this.ticketHistory.createHistory(
            nextStatus,
            ticket,
            transactionManager,
            currentHistory,
          );

          const ticketCompleted =
            await this.ticketService.findAllDetailsByIdOrFail(
              id,
              transactionManager,
            );

          let pdfResponse: IPdfResult;
          try {
            pdfResponse =
              await this.responsePdfsService.pdfResponseBucket(ticketCompleted);
          } catch (error) {
            this.logger.error('Error generando el PDF al archivar:', error);
            throw new ServiceUnavailableException(
              this.i18n.t('errors.tickets.pdf_generation_failed'),
            );
          }

          const newDocument = transactionManager.create(Document, {
            name: pdfResponse.fileName,
            url: pdfResponse.url,
            ticket: ticketCompleted,
            type_document: { id: 2 },
          });

          await transactionManager.save(Document, newDocument);
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
    this.eventEmitter.emit('ticket.archived', archivedTicket);
    return archivedTicket;
  }
}
