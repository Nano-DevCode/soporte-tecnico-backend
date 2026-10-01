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
import { ResponsePdfsService } from '../../response-pdfs/response-pdfs.service';
import { Document } from 'src/documents/entities/document.entity';
import { CloseTicketDto } from '../dto/close-ticket.dto';
import { SurveyService } from '../../survey/survey.service';
import { I18nService } from 'nestjs-i18n';
import { IPdfResult } from 'src/common/interfaces/interface';

@Injectable()
export class CloseTicketService {
  private readonly logger = new Logger('CloseTicketService');

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly responseSignatureService: ResponseSignatureService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ResponsesService))
    private readonly responsesService: ResponsesService,
    private readonly responsePdfsService: ResponsePdfsService,
    private readonly surveyService: SurveyService,
    private readonly i18n: I18nService,
  ) {}

  async closeTicket(id: string, user: User, closeTicketDto: CloseTicketDto) {
    const { staff: jefeDepto } = await this.usersService.findOne(user.id);
    let ticket = await this.ticketService.findOneByIdOrFail(id);

    if (!jefeDepto) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.no_department_boss_profile'),
      );
    }

    if (!ticket.jefe_depto) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.ticket_no_boss_assigned'),
      );
    }

    if (ticket.jefe_depto.id !== jefeDepto.id) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.only_creator_can_close'),
      );
    }

    if (!jefeDepto.rfc || jefeDepto.rfc.trim() === '') {
      throw new ConflictException(this.i18n.t('errors.tickets.missing_rfc'));
    }

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const nextStatusCode = transition(
      currentHistory.status.code as TicketStatus,
      TicketEvent.CERRAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let closedTicket: Ticket;
    try {
      closedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          ticket.updated_at = new Date();
          ticket = await transactionManager.save(Ticket, ticket);

          const response = await this.responsesService.findByTicketIdOrFail(
            id,
            transactionManager,
          );

          await this.surveyService.submitSurvey(
            closeTicketDto,
            ticket,
            transactionManager,
          );

          await this.responseSignatureService.signResponse(
            response,
            jefeDepto.rfc,
            SignatureRole.JEFE_DEPTO,
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

          let pdfResult: IPdfResult;
          try {
            pdfResult =
              await this.responsePdfsService.pdfResponseBucket(ticketCompleted);
          } catch (error) {
            this.logger.error(
              'Error generando el PDF al cerrar ticket:',
              error,
            );
            throw new ServiceUnavailableException(
              this.i18n.t('errors.tickets.pdf_generation_failed'),
            );
          }
          const newDocument = transactionManager.create(Document, {
            name: pdfResult.fileName,
            url: pdfResult.url,
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
    this.eventEmitter.emit('ticket.closed', closedTicket);
    return closedTicket;
  }
}
