import { forwardRef, Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { SchoolPeriodsModule } from 'src/school-periods/school-periods.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { TicketHistoryModule } from 'src/ticket-history/ticket-history.module';
import { IssueTypeModule } from 'src/issue_type/issue_type.module';
import { AttendsModule } from 'src/attends/attends.module';
import {
  AssignTicketService,
  CreateTicketService,
  EditTicketService,
  InterveneTicketService,
  PauseTicketService,
  RouteTicketService,
  StartTicketService,
  TicketsService,
} from './services';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { RejectionReportsModule } from 'src/rejection-reports/rejection-reports.module';
import { RejectTicketService } from './services/reject-ticket.service';
import { TechnicalReportsModule } from 'src/technical-reports/technical-reports.module';
import { FolioCountersModule } from 'src/folio-counters/folio-counters.module';
import { PauseReportsModule } from 'src/pause-reports/pause-reports.module';
import { FinishTicketService } from './services/finish-ticket.service';
import { ResponsesModule } from 'src/responses/responses.module';
import { ResponseSignatureModule } from 'src/response-signature/response-signature.module';
import { CloseTicketService } from './services/close-ticket.service';
import { ArchiveTicketService } from './services/archive-ticket.service';
import { TagsModule } from 'src/tags/tags.module';
import { ResponsePdfsModule } from 'src/response-pdfs/response-pdfs.module';
import { ConsumableMovementsModule } from 'src/consumable-movements/consumable-movements.module';
import { SurveyModule } from 'src/survey/survey.module';
import { FaultValiditiesModule } from 'src/fault-validities/fault-validities.module';

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
    ResponsePdfsModule,
    forwardRef(() => ConsumableMovementsModule),
    SurveyModule,
    FaultValiditiesModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
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
  ],
  exports: [TicketsService, TypeOrmModule],
})
export class TicketsModule {}
