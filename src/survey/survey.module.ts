import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { SurveyQuestion } from './entities/survey-question.entity';
import { TicketSurvey } from './entities/ticket-survey.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyQuestion, TicketSurvey])],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService, TypeOrmModule],
})
export class SurveyModule {}
