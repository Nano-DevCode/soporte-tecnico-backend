import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerInputDto {
  @ApiProperty({
    description: 'ID único de la pregunta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description: 'Valor numérico de la calificación (1 al 5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue?: number;

  @ApiPropertyOptional({
    description: 'Respuesta en formato de texto libre',
    example: 'El técnico resolvió el problema muy rápido.',
  })
  @IsOptional()
  @IsString()
  textValue?: string;
}

export class SubmitSurveyDto {
  @ApiProperty({
    description: 'Lista de respuestas proporcionadas por el usuario',
    type: [AnswerInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInputDto)
  answers: AnswerInputDto[];
}
