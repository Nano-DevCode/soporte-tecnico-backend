import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attend } from './entities/attend.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Staff } from 'src/staff/entities/staff.entity';
import { I18nService } from 'nestjs-i18n';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AttendsService {
  constructor(
    @InjectRepository(Attend)
    private readonly attendsRepository: Repository<Attend>,
    private readonly i18n: I18nService,
  ) {}

  async attendTicketWithEntities(
    ticket: Ticket,
    incomingTechnicians: Staff[],
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.attendsRepository.manager;
    const currentAttends = await this.getCurrentAttends(ticket.id, manager);

    const currentTechIds = currentAttends.map((a) => a.technician.id);
    const incomingTechIds = incomingTechnicians.map((t) => t.id);

    const attendsToDeactivate = currentAttends.filter(
      (attend) => !incomingTechIds.includes(attend.technician.id),
    );

    for (const attend of attendsToDeactivate) {
      attend.is_active = false;
    }

    const newTechnicians = incomingTechnicians.filter(
      (tech) => !currentTechIds.includes(tech.id),
    );

    const attendsToInsert = newTechnicians.map((technician) => {
      return manager.create(Attend, {
        ticket: ticket,
        technician: technician,
        is_active: true,
      });
    });

    if (attendsToDeactivate.length > 0) {
      await manager.save(Attend, attendsToDeactivate);
    }

    if (attendsToInsert.length > 0) {
      await manager.save(Attend, attendsToInsert);
    }

    return {
      deactivated: attendsToDeactivate.length,
      inserted: attendsToInsert.length,
    };
  }

  async getCurrentAttends(
    ticketId: string,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.attendsRepository.manager;

    const currentAttends = await manager.find(Attend, {
      where: { ticket: { id: ticketId }, is_active: true },
      relations: ['technician'],
      select: {
        id: true,
        is_active: true,
        is_attending: true,
        technician: {
          id: true,
        },
      },
    });
    return currentAttends;
  }

  async startAttention(
    ticketId: string,
    user: User,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.attendsRepository.manager;

    const currentAttends = await manager.find(Attend, {
      where: { ticket: { id: ticketId }, is_active: true },
      relations: ['technician', 'technician.user'],
    });

    if (currentAttends.length === 0) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.no_active_attends', {
          defaultValue: 'El ticket no tiene técnicos asignados actualmente.',
        }),
      );
    }

    const isUserAssigned = currentAttends.some(
      (attend) => attend.technician?.user?.id === user.id,
    );

    if (!isUserAssigned) {
      throw new ForbiddenException(
        this.i18n.t('errors.tickets.not_assigned_to_user', {
          defaultValue:
            'No tienes permiso para iniciar este ticket porque no estás asignado a él.',
        }),
      );
    }

    const technicianIds = currentAttends.map((a) => a.technician.id);

    const busyTechnician = await manager
      .getRepository(Attend)
      .createQueryBuilder('attend')
      .innerJoinAndSelect('attend.technician', 'technician')
      .where('attend.technicianId IN (:...technicianIds)', { technicianIds })
      .andWhere('attend.is_attending = :isAttending', { isAttending: true })
      .andWhere('attend.ticketId != :ticketId', { ticketId })
      .setLock('pessimistic_write')
      .getOne();

    if (busyTechnician) {
      throw new ConflictException(
        this.i18n.t('errors.tickets.technician_already_busy', {
          args: { name: busyTechnician.technician.name },
        }),
      );
    }

    await manager.update(
      Attend,
      { ticket: ticketId, is_active: true },
      { is_attending: true },
    );
  }

  async endAttention(ticketId: string, transactionManager?: EntityManager) {
    const manager = transactionManager || this.attendsRepository.manager;
    await manager.update(
      Attend,
      { ticket: ticketId, is_active: true },
      { is_attending: false },
    );
  }
}
