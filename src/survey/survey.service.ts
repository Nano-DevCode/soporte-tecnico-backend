import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  QuestionType,
  SurveyQuestion,
} from './entities/survey-question.entity';
import { EntityManager, Repository } from 'typeorm';
import { AnswerSnapshot, TicketSurvey } from './entities/ticket-survey.entity';
import { SubmitSurveyDto } from './dto/answer-input.dto';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  SurveyReportColumn,
  SurveyReportConfig,
} from 'src/excel/interfaces/report-config.interface';
import { FilterTicketReportsDto } from 'src/tickets/dto/filter-ticket-reports.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyQuestion)
    private questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(TicketSurvey)
    private surveyRepository: Repository<TicketSurvey>,
    private readonly i18n: I18nService,
  ) {}

  async createQuestion(questionText: string, type: QuestionType) {
    const newQuestion = this.questionRepository.create({ questionText, type });
    return await this.questionRepository.save(newQuestion);
  }

  async getActiveQuestions() {
    return await this.questionRepository.find({
      where: { isActive: true },
      order: { type: 'ASC' },
    });
  }

  async findAllQuestions(filterDto: FilterQuestionsDto) {
    const { limit, page, search, is_active } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.questionRepository.createQueryBuilder('question');

    if (is_active !== undefined) {
      queryBuilder.andWhere('question.isActive = :isActive', {
        isActive: is_active,
      });
    }

    if (search) {
      queryBuilder.andWhere('question.questionText ILIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('question.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationResponse({ data, total }, filterDto);
  }

  async submitSurvey(
    dto: SubmitSurveyDto,
    ticket: Ticket,
    manager?: EntityManager,
  ) {
    const surveyRepo = manager
      ? manager.getRepository(TicketSurvey)
      : this.surveyRepository;

    const { answers } = dto;
    const existingSurvey = await surveyRepo.findOne({
      where: { ticket: { id: ticket.id } },
    });
    if (existingSurvey) {
      throw new BadRequestException(
        this.i18n.t('errors.survey.already_submitted'),
      );
    }

    const activeQuestions = await this.getActiveQuestions();
    const snapshotAnswers: AnswerSnapshot[] = [];

    for (const activeQ of activeQuestions) {
      const userAns = answers.find((a) => a.questionId === activeQ.id);

      if (!userAns) {
        throw new BadRequestException(
          this.i18n.t('errors.survey.missing_mandatory_question', {
            args: { question: activeQ.questionText },
          }),
        );
      }

      let finalValue: string | number;

      if (activeQ.type === QuestionType.RATING) {
        if (userAns.ratingValue === undefined) {
          throw new BadRequestException(
            this.i18n.t('errors.survey.requires_numeric_rating', {
              args: { question: activeQ.questionText },
            }),
          );
        }
        finalValue = userAns.ratingValue;
      } else {
        finalValue = userAns.textValue || '';
      }

      snapshotAnswers.push({
        questionId: activeQ.id,
        questionText: activeQ.questionText,
        type: activeQ.type,
        value: finalValue,
      });
    }

    const newSurvey = surveyRepo.create({
      ticket,
      answers: snapshotAnswers,
    });

    return await surveyRepo.save(newSurvey);
  }

  async findOneOrFail(id: string): Promise<SurveyQuestion> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(
        this.i18n.t('errors.survey.question_not_found', {
          args: { id },
        }),
      );
    }
    return question;
  }

  async activate(id: string): Promise<SurveyQuestion> {
    const question = await this.findOneOrFail(id);
    question.isActive = true;
    return await this.questionRepository.save(question);
  }

  async deactivate(id: string): Promise<SurveyQuestion> {
    const question = await this.findOneOrFail(id);
    question.isActive = false;
    return await this.questionRepository.save(question);
  }

  async updateQuestion(
    id: string,
    updateDto: UpdateQuestionDto,
  ): Promise<SurveyQuestion> {
    const question = await this.findOneOrFail(id);

    if (updateDto.questionText !== undefined) {
      question.questionText = updateDto.questionText;
    }

    if (updateDto.type !== undefined) {
      question.type = updateDto.type;
    }

    return await this.questionRepository.save(question);
  }

  async getSurveysExcelReport(
    filterDto: FilterTicketReportsDto,
  ): Promise<SurveyReportConfig> {
    const { school_period } = filterDto;

    const surveys = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.ticket', 'ticket')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .where('ticket.schoolPeriodId = :schoolPeriod', {
        schoolPeriod: school_period,
      })
      .orderBy('survey.createdAt', 'DESC')
      .getMany();

    if (surveys.length === 0) {
      return {
        title: 'Reporte de Satisfacción de Soporte Técnico',
        columns: [
          { header: 'Folio Ticket', key: 'folio', width: 15 },
          { header: 'Fecha Calificación', key: 'date', width: 20 },
        ],
        data: [],
      };
    }

    const questionsMap = new Map<
      string,
      { text: string; type: 'RATING' | 'TEXT' }
    >();
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    surveys.forEach((survey) => {
      if (Array.isArray(survey.answers)) {
        survey.answers.forEach((ans) => {
          if (!questionsMap.has(ans.questionId)) {
            questionsMap.set(ans.questionId, {
              text: ans.questionText,
              type: ans.type,
            });
          }
          if (ans.type === 'RATING' && typeof ans.value === 'number') {
            totalRatingSum += ans.value;
            totalRatingCount++;
          }
        });
      }
    });

    const overallAverage =
      totalRatingCount > 0
        ? Number((totalRatingSum / totalRatingCount).toFixed(2))
        : undefined;

    const columns: SurveyReportColumn[] = [
      { header: 'Folio Ticket', key: 'folio', width: 18 },
      { header: 'Fecha Calificación', key: 'createdAt', width: 20 },
    ];

    questionsMap.forEach((qInfo, qId) => {
      columns.push({
        header: qInfo.text,
        key: `q_${qId}`,
        width: qInfo.type === 'TEXT' ? 45 : 22,
        isRating: qInfo.type === 'RATING',
        isLongText: qInfo.type === 'TEXT',
      });
    });

    const data: Record<string, unknown>[] = surveys.map((survey) => {
      const row: Record<string, unknown> = {
        folio: survey.ticket?.folio || 'N/A',
        createdAt: survey.createdAt
          ? new Date(survey.createdAt).toLocaleDateString()
          : 'N/A',
      };

      if (Array.isArray(survey.answers)) {
        survey.answers.forEach((ans) => {
          row[`q_${ans.questionId}`] = ans.value;
        });
      }

      return row;
    });
    return {
      title: 'Reporte de Satisfacción de Soporte Técnico',
      sheetName: 'Satisfacción',
      columns,
      data,
      overallAverage,
    };
  }
}
