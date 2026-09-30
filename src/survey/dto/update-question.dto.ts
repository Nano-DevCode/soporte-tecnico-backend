import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { QuestionType } from '../entities/survey-question.entity';

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'El nuevo texto de la pregunta',
    example: '¿Cómo calificarías la rapidez en la resolución de tu ticket?',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  questionText?: string;

  @ApiPropertyOptional({
    description: 'El tipo de respuesta esperada',
    enum: QuestionType,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;
}
