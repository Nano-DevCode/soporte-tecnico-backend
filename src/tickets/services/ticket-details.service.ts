import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TicketDetailsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly i18n: I18nService,
  ) {}

  async findOne(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'ticket_histories',
        'ticket_histories.status',
        'issue_type',
        'jefe_depto',
        'jefe_depto.user',
        'jefe_depto.department',
        'coordinator',
        'tags',
        'attends',
        'attends.technician',
      ],
    });
    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('errors.tickets.not_found', {
          args: { id },
        }),
      );
    }
    return ticket;
  }

  async findOneByIdWithDetailsOrFail(
    id: string,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.ticketRepository.manager;
    const ticket = await manager.findOne(Ticket, {
      where: {
        id,
      },
      relations: [
        'ticket_histories',
        'ticket_histories.status',
        'issue_type',
        'jefe_depto.department',
        'jefe_depto.user',
        'coordinator.user',
        'tags',
        'attends',
        'attends.technician.user',
        'documents.type_document',
      ],
      order: {
        ticket_histories: {
          created_at: 'ASC',
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('errors.tickets.not_found', {
          args: { id },
        }),
      );
    }

    if (ticket.attends) {
      ticket.attends = ticket.attends.filter(
        (attend) => attend.is_active === true,
      );
    }
    return {
      ...ticket,
      currentStatusCode: ticket.ticket_histories?.at(-1)?.status?.code || null,
    };
  }

  async findAuthorizedDetails(
    id: string,
    user: User,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.ticketRepository.manager;
    const ticket = await manager.findOne(Ticket, {
      where: {
        id,
      },
      relations: [
        'ticket_histories',
        'ticket_histories.status',
        'issue_type',
        'jefe_depto.department',
        'jefe_depto.user',
        'coordinator',
        'tags',
        'attends',
        'attends.technician.user',
        'documents.type_document',
      ],
      order: {
        ticket_histories: {
          created_at: 'ASC',
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('errors.tickets.not_found', {
          args: { id },
        }),
      );
    }

    const userRole = user.role?.name as ValidRole;
    const staffId = user.staff?.id;
    let hasAccess: boolean;

    switch (userRole) {
      case ValidRole.superAdmin:
      case ValidRole.jefecc:
      case ValidRole.secretaria:
      case ValidRole.planning:
      case ValidRole.visitor:
      case ValidRole.inventory:
        hasAccess = true;
        break;

      case ValidRole.jefe:
        hasAccess = ticket.jefe_depto?.id === staffId;
        break;

      case ValidRole.coordinador:
        hasAccess = ticket.coordinator?.id === staffId;
        break;

      case ValidRole.tecnico:
        hasAccess =
          ticket.attends?.some(
            (attend) =>
              attend.technician?.id === staffId && attend.is_active === true,
          ) ?? false;
        break;

      default:
        hasAccess = false;
        break;
    }

    if (!hasAccess) {
      throw new ForbiddenException(this.i18n.t('errors.tickets.forbidden'));
    }

    if (ticket.attends) {
      ticket.attends = ticket.attends.filter(
        (attend) => attend.is_active === true,
      );
    }
    return {
      ...ticket,
      currentStatusCode: ticket.ticket_histories?.at(-1)?.status?.code || null,
    };
  }

  async findAllDetailsByIdOrFail(
    id: string,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.ticketRepository.manager;
    const ticket = await manager.findOne(Ticket, {
      where: {
        id,
      },
      relations: [
        'ticket_histories',
        'ticket_histories.status',
        'issue_type',
        'jefe_depto.department',
        'coordinator',
        'tags',
        'attends',
        'attends.technician',
        'documents.type_document',
        'response.maintenance_type',
        'response.service_type',
        'response.computing_center_manager',
        'response.signatures',
      ],
      order: {
        ticket_histories: {
          created_at: 'ASC',
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('errors.tickets.not_found', {
          args: { id },
        }),
      );
    }
    if (ticket.attends) {
      ticket.attends = ticket.attends.filter(
        (attend) => attend.is_active === true,
      );
    }
    return {
      ...ticket,
      currentStatusCode: ticket.ticket_histories?.at(-1)?.status?.code || null,
    };
  }

  async findOneByIdOrFail(id: string, transactionManager?: EntityManager) {
    const manager = transactionManager || this.ticketRepository.manager;
    const ticket = await manager.findOne(Ticket, {
      where: { id },
      relations: [
        'ticket_histories',
        'ticket_histories.status',
        'jefe_depto',
        'jefe_depto.department',
        'issue_type',
      ],
      order: {
        ticket_histories: {
          created_at: 'ASC',
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('errors.tickets.not_found', {
          args: { id },
        }),
      );
    }
    return ticket;
  }

  getCurrentStatus(ticket: Ticket) {
    return ticket.ticket_histories[ticket.ticket_histories.length - 1].status;
  }

  getCurrentHistory(ticket: Ticket) {
    return ticket.ticket_histories[ticket.ticket_histories.length - 1];
  }
}
