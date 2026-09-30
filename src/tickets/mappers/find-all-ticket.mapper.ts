import { TicketResponseDto } from '../dto/ticket-response.dto';
import { Ticket } from '../entities/ticket.entity';

export class FindAllTicketMapper {
  static toResponse(ticket: Ticket): TicketResponseDto {
    const sortedHistories = [...ticket.ticket_histories].sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    const currentHistory = sortedHistories[0];

    return {
      id: ticket.id,
      folio: ticket.folio,
      internal_folio: ticket.internal_folio,
      status: currentHistory?.status?.name || 'SIN ESTADO',
      status_code: currentHistory?.status?.code || 'UNKNOWN',
      priority: ticket.priority || 0,
      description: ticket.description,
      tags: ticket.tags,
      jefe_depto: ticket.jefe_depto
        ? {
            id: ticket.jefe_depto.id,
            full_name: `${ticket.jefe_depto.name} ${ticket.jefe_depto.maternalSurname} ${ticket.jefe_depto.paternalSurname}`,
            email: ticket.jefe_depto.user?.email,
            department: ticket.jefe_depto.department
              ? {
                  name: ticket.jefe_depto.department.name,
                  id: ticket.jefe_depto.department.id,
                }
              : null,
          }
        : null,
      issue_type: ticket.issue_type
        ? {
            name: ticket.issue_type.name,
            id: ticket.issue_type.id,
          }
        : null,
      school_period: ticket.school_period
        ? {
            name: ticket.school_period.name,
            id: ticket.school_period.id,
          }
        : null,
      documents: ticket.documents,
      created_at: ticket.created_at.toISOString(),
    };
  }

  static toResponseArray(tickets: Ticket[]): TicketResponseDto[] {
    return tickets.map((ticket) => this.toResponse(ticket));
  }
}
