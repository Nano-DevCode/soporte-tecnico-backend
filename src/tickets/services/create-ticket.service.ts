import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { SchoolPeriodsService } from 'src/school-periods/school-periods.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TicketEvent,
  TicketStatus,
  transition,
} from 'src/common/machine/TicketStateMachine.machine';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { IssueTypeService } from '../../issue_type/issue_type.service';
import { CreateTicketDto } from '../dto';
import { TicketsService } from './tickets.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Document } from 'src/documents/entities/document.entity';
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { Staff } from 'src/users/entities/staff.entity';
import { CreateTicketOnBehalfDto } from '../dto/create-ticket-on-behalf';
import { I18nService } from 'nestjs-i18n';
import { IPdfResult } from 'src/common/interfaces/interface';
import { RouteTicketService } from './route-ticket.service';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@Injectable()
export class CreateTicketService {
  constructor(
    private readonly schoolPeriodService: SchoolPeriodsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ticketHistory: TicketHistoryService,
    private readonly issueTypeService: IssueTypeService,
    private readonly ticketService: TicketsService,
    private readonly usersService: UsersService,
    private readonly responsePdfsService: PdfsService,
    private readonly folioCountersService: FolioCountersService,
    private readonly routeTicketService: RouteTicketService,
    private readonly i18n: I18nService,
  ) {}

  private readonly logger = new Logger('CreateTicket');

  async create(createTicketDto: CreateTicketDto, user: User) {
    const { staff: jefeDepto } = await this.usersService.findOne(user.id);
    return this.executeTicketTransaction(createTicketDto, jefeDepto);
  }

  async createOnBehalf(
    { user_id, ...ticketData }: CreateTicketOnBehalfDto,
    creator: User,
  ) {
    const { staff: jefeDepto } = await this.usersService.findOne(user_id);

    const ticket = await this.executeTicketTransaction(ticketData, jefeDepto);

    // Auto-canalizar si el creador es un coordinador
    let routingFailed = false;

    if ((creator.role?.name as ValidRole) === ValidRole.coordinador) {
      if (creator.staff?.id) {
        try {
          await this.routeTicketService.routeTicket(ticket.id, {
            coordinatorId: creator.staff.id,
          });
        } catch (error) {
          this.logger.error('Error auto-canalizando el ticket creado', error);
          routingFailed = true;
        }
      }
    }

    return { ...ticket, routingFailed };
  }

  private async executeTicketTransaction(
    { issue_type, ...ticketData }: CreateTicketDto,
    jefeDepto: Staff,
  ) {
    if (!jefeDepto.department.status) {
      throw new BadRequestException(
        this.i18n.t('errors.tickets.department_inactive', {
          args: { departmentName: jefeDepto.department.name || 'solicitado' },
        }),
      );
    }
    await this.issueTypeService.findOneOrFail(issue_type);
    const { name: periodName, id: schoolPeriodId } =
      await this.schoolPeriodService.getActiveSchoolPeriodOrFail();
    const { acronym, id: departmentId, priority } = jefeDepto.department;

    const estadoSiguiente = transition(
      TicketStatus.IDLE,
      TicketEvent.RECIBIR,
      this.i18n,
    );
    const statusDb =
      await this.ticketHistory.findStatusByCodeOrFail(estadoSiguiente);

    const createdTicket = await this.dataSource.transaction(
      async (transactionManager) => {
        const newFolio =
          await this.folioCountersService.generateDepartmentTicketFolio(
            departmentId,
            acronym,
            schoolPeriodId,
            periodName,
            transactionManager,
          );

        const newOtFolio = await this.folioCountersService.generateOTFolio(
          acronym,
          transactionManager,
        );

        const ticket = transactionManager.create(Ticket, {
          ...ticketData,
          priority: priority,
          folio: newFolio,
          ot_folio: newOtFolio,
          issue_type: { id: issue_type },
          school_period: { id: schoolPeriodId },
          jefe_depto: { id: jefeDepto.id },
        });

        const savedTicket = await transactionManager.save(ticket);

        await this.ticketHistory.createHistory(
          statusDb,
          savedTicket,
          transactionManager,
        );

        const ticketCompleted =
          await this.ticketService.findOneByIdWithDetailsOrFail(
            savedTicket.id,
            transactionManager,
          );

        let pdfResult: IPdfResult;
        try {
          pdfResult =
            await this.responsePdfsService.pdfRequestBucket(ticketCompleted);
        } catch (error) {
          this.logger.error('Error generando el PDF:', error);

          throw new ServiceUnavailableException(
            this.i18n.t('errors.tickets.pdf_generation_failed'),
          );
        }

        const newDocument = transactionManager.create(Document, {
          name: pdfResult.fileName,
          url: pdfResult.url,
          ticket: savedTicket,
          type_document: { id: 1 },
        });

        await transactionManager.save(Document, newDocument);

        return await this.ticketService.findOneByIdWithDetailsOrFail(
          savedTicket.id,
          transactionManager,
        );
      },
    );

    this.eventEmitter.emit('ticket.created', createdTicket);
    return createdTicket;
  }
}
