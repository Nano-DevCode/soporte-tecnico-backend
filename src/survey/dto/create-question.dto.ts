import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { QuestionType } from '../entities/survey-question.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({
    description:
      'Texto de la pregunta que se mostrará al usuario en el formulario',
    example: '¿Cómo calificarías la velocidad de resolución de tu problema?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Tipo de respuesta esperada para esta pregunta',
    enum: QuestionType,
    example: QuestionType.RATING,
  })
  @IsEnum(QuestionType)
  type: QuestionType;
}
