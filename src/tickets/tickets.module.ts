import { forwardRef, Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { SchoolPeriodsModule } from 'src/school-periods/school-periods.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { TicketHistoryModule } from 'src/ticket-history/ticket-history.module';
import { IssueTypeModule } from 'src/issue_type/issue_type.module';
import { AttendsModule } from 'src/attends/attends.module';
import { TicketsService } from './services/tickets.service';
import { TicketQueriesService } from './services/ticket-queries.service';
import { TicketDetailsService } from './services/ticket-details.service';
import { TicketReportsService } from './services/ticket-reports.service';
import { TicketAdminOpsService } from './services/ticket-admin-ops.service';
import { CreateTicketService } from './services/create-ticket.service';
import { AssignTicketService } from './services/assign-ticket.service';
import { RouteTicketService } from './services/route-ticket.service';
import { StartTicketService } from './services/start-ticket.service';
import { EditTicketService } from './services/edit-ticket.service';
import { RejectTicketService } from './services/reject-ticket.service';
import { InterveneTicketService } from './services/intervene-ticket.service';
import { PauseTicketService } from './services/pause-ticket.service';
import { FinishTicketService } from './services/finish-ticket.service';
import { CloseTicketService } from './services/close-ticket.service';
import { ArchiveTicketService } from './services/archive-ticket.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { RejectionReportsModule } from 'src/technical-reports/rejection-reports/rejection-reports.module';
import { TechnicalReportsModule } from 'src/technical-reports/technical-reports.module';
import { FolioCountersModule } from 'src/folio-counters/folio-counters.module';
import { PauseReportsModule } from 'src/technical-reports/pause-reports/pause-reports.module';
import { ResponsesModule } from 'src/responses/responses.module';
import { ResponseSignatureModule } from 'src/response-signature/response-signature.module';
import { TagsModule } from 'src/tags/tags.module';
import { PdfsModule } from 'src/pdfs/pdfs.module';
import { ConsumableMovementsModule } from 'src/consumables/movements/consumable-movements.module';
import { SurveyModule } from 'src/survey/survey.module';
import { FaultValiditiesModule } from 'src/technical-reports/fault-validities/fault-validities.module';

import { TicketsSeedController } from './seed/controllers/tickets-seed.controller';
import { TicketsSeedService } from './seed/services/tickets-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    SchoolPeriodsModule,
    DepartmentsModule,
    TicketHistoryModule,
    IssueTypeModule,
    AttendsModule,
    AuthModule,
    UsersModule,
    RejectionReportsModule,
    TechnicalReportsModule,
    FolioCountersModule,
    PauseReportsModule,
    forwardRef(() => ResponsesModule),
    ResponseSignatureModule,
    TagsModule,
    PdfsModule,
    forwardRef(() => ConsumableMovementsModule),
    SurveyModule,
    FaultValiditiesModule,
  ],
  controllers: [TicketsController, TicketsSeedController],
  providers: [
    TicketsService,
    TicketQueriesService,
    TicketDetailsService,
    TicketReportsService,
    TicketAdminOpsService,
    CreateTicketService,
    AssignTicketService,
    RouteTicketService,
    StartTicketService,
    EditTicketService,
    RejectTicketService,
    InterveneTicketService,
    PauseTicketService,
    FinishTicketService,
    CloseTicketService,
    ArchiveTicketService,
    TicketsSeedService,
  ],
  exports: [
    TicketsService,
    TicketQueriesService,
    TicketDetailsService,
    TicketReportsService,
    TicketAdminOpsService,
    TicketsSeedService,
    TypeOrmModule,
  ],
})
export class TicketsModule {}
