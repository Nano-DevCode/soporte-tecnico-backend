import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TicketsModule } from 'src/tickets/tickets.module';
import { EquipmentsModule } from 'src/equipments/equipments.module';
import { ConsumableMovementsModule } from 'src/consumables/movements/consumable-movements.module';
import { TicketHistoryModule } from 'src/ticket-history/ticket-history.module';
import { SurveyModule } from 'src/survey/survey.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { IssueTypeModule } from 'src/issue_type/issue_type.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TicketsModule,
    EquipmentsModule,
    ConsumableMovementsModule,
    TicketHistoryModule,
    SurveyModule,
    DepartmentsModule,
    IssueTypeModule,
    CommonModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
