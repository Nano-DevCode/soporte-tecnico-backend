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
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { ResponsesService } from '../../responses/responses.service';
import { FinishTicketDto } from '../dto';
import { ResponsePdfsService } from '../../response-pdfs/response-pdfs.service';
import { Document } from 'src/documents/entities/document.entity';
import { I18nService } from 'nestjs-i18n';
import { IPdfResult } from 'src/common/interfaces/interface';
import { AttendsService } from '../../attends/attends.service';
import { TechnicalReportsService } from '../../technical-reports/technical-reports.service';
import { FaultValiditiesService } from 'src/fault-validities/fault-validities.service';

@Injectable()
export class FinishTicketService {
  private readonly logger = new Logger('FinishTicketService');

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly ticketService: TicketsService,
    private readonly folioCounterService: FolioCountersService,
    @Inject(forwardRef(() => ResponsesService))
    private readonly responsesService: ResponsesService,
    private readonly responsePdfsService: ResponsePdfsService,
    private readonly i18n: I18nService,
    private readonly attendService: AttendsService,
    private readonly technicalReportsService: TechnicalReportsService,
    private readonly faultValiditiesService: FaultValiditiesService,
  ) {}

  // * Finalizar un ticket.
  async finishTicket(id: string, finishTicketDto: FinishTicketDto) {
    let ticket = await this.ticketService.findOneByIdOrFail(id);

    const currentHistory = this.ticketService.getCurrentHistory(ticket);
    const currentStatus = currentHistory.status.code as TicketStatus;
    const nextStatusCode = transition(
      currentStatus,
      TicketEvent.FINALIZAR,
      this.i18n,
    );
    const nextStatus =
      await this.ticketHistory.findStatusByCodeOrFail(nextStatusCode);

    let finishedTicket: Ticket;
    try {
      finishedTicket = await this.dataSource.transaction(
        async (transactionManager) => {
          if (!ticket.internal_folio) {
            ticket.internal_folio =
              await this.folioCounterService.generateNewFolio(
                ticket.jefe_depto.department.acronym,
                transactionManager,
              );
          }

          ticket.updated_at = new Date();

          ticket = await transactionManager.save(Ticket, ticket);

          // Asegurar que si el técnico estaba atendiendo el ticket, la atención se cierre correctamente
          await this.attendService.endAttention(id, transactionManager);

          if (currentStatus === TicketStatus.ATENDIENDO) {
            const faultValidities = await this.faultValiditiesService.findAll();
            const faultValidity = faultValidities.find(
              (fv) => fv.name === 'Trámite administrativo',
            );

            if (faultValidity) {
              await this.technicalReportsService.create(
                {
                  ticketId: id,
                  diagnosis: finishTicketDto.diagnosis,
                  work_performed: finishTicketDto.work_done,
                  is_resolved: true,
                  fault_validity_id: faultValidity.id,
                },
                transactionManager,
              );
            } else {
              this.logger.warn(
                'No se encontró la validez de falla "Trámite administrativo" al finalizar automáticamente el ticket.',
              );
            }
          }

          await this.responsesService.create(
            { ...finishTicketDto, ticket_id: id },
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
            this.logger.error('Error generando el PDF al finalizar:', error);
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

          return await this.ticketService.findOneByIdWithDetailsOrFail(
            ticketCompleted.id,
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
    this.eventEmitter.emit('ticket.finished', finishedTicket);
    return finishedTicket;
  }
}
