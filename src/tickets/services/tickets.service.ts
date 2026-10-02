import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { UpdateTicketInternalFolioDto } from '../dto/update-ticket-internal-folio.dto';
import { FilterTicketsForSelectDto } from '../dto/filter-tickets-for-select';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { FilterTicketReportsDto } from '../dto/filter-ticket-reports.dto';
import { RegeneratePdfDto } from '../dto/regenerate-pdf.dto';
import { TicketQueriesService } from './ticket-queries.service';
import { TicketDetailsService } from './ticket-details.service';
import { TicketReportsService } from './ticket-reports.service';
import { TicketAdminOpsService } from './ticket-admin-ops.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketQueriesService: TicketQueriesService,
    private readonly ticketDetailsService: TicketDetailsService,
    private readonly ticketReportsService: TicketReportsService,
    private readonly ticketAdminOpsService: TicketAdminOpsService,
  ) {}

  get allowedSortColumns() {
    return this.ticketQueriesService.allowedSortColumns;
  }

  findAllForUser(filterTicketsDto: FilterTicketsDto, user: User) {
    return this.ticketQueriesService.findAllForUser(filterTicketsDto, user);
  }

  findCurrentForUser(filterTicketsDto: FilterTicketsDto, user: User) {
    return this.ticketQueriesService.findCurrentForUser(filterTicketsDto, user);
  }

  findAllClosedAndArchived(filterTicketsDto: FilterTicketsDto) {
    return this.ticketQueriesService.findAllClosedAndArchived(filterTicketsDto);
  }

  findAllByStatusForSelect(dto: FilterTicketsForSelectDto) {
    return this.ticketQueriesService.findAllByStatusForSelect(dto);
  }

  findAllPaginated(paginationWithPageDto: PaginationWithPageDto) {
    return this.ticketQueriesService.findAllPaginated(paginationWithPageDto);
  }

  findOne(id: string) {
    return this.ticketDetailsService.findOne(id);
  }

  findOneByIdWithDetailsOrFail(id: string, transactionManager?: EntityManager) {
    return this.ticketDetailsService.findOneByIdWithDetailsOrFail(
      id,
      transactionManager,
    );
  }

  findAuthorizedDetails(
    id: string,
    user: User,
    transactionManager?: EntityManager,
  ) {
    return this.ticketDetailsService.findAuthorizedDetails(
      id,
      user,
      transactionManager,
    );
  }

  findAllDetailsByIdOrFail(id: string, transactionManager?: EntityManager) {
    return this.ticketDetailsService.findAllDetailsByIdOrFail(
      id,
      transactionManager,
    );
  }

  findOneByIdOrFail(id: string, transactionManager?: EntityManager) {
    return this.ticketDetailsService.findOneByIdOrFail(id, transactionManager);
  }

  getCurrentStatus(ticket: Ticket) {
    return this.ticketDetailsService.getCurrentStatus(ticket);
  }

  getCurrentHistory(ticket: Ticket) {
    return this.ticketDetailsService.getCurrentHistory(ticket);
  }

  getTicketsSummaryReport(filterTicketReportsDto: FilterTicketReportsDto) {
    return this.ticketReportsService.getTicketsSummaryReport(
      filterTicketReportsDto,
    );
  }

  updateInternalFolio(
    ticketId: string,
    updateTicketInternalFolioDto: UpdateTicketInternalFolioDto,
  ) {
    return this.ticketAdminOpsService.updateInternalFolio(
      ticketId,
      updateTicketInternalFolioDto,
    );
  }

  regeneratePdf(ticketId: string, regeneratePdfDto: RegeneratePdfDto) {
    return this.ticketAdminOpsService.regeneratePdf(ticketId, regeneratePdfDto);
  }
}
