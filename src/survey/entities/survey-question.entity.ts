import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum QuestionType {
  RATING = 'RATING',
  TEXT = 'TEXT',
}

@Entity('survey_questions')
export class SurveyQuestion {
  @ApiProperty({
    description: 'Identificador único de la pregunta (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Texto de la pregunta de satisfacción que se presentará al usuario',
    example: '¿Cómo calificarías la atención del técnico?',
  })
  @Column({ type: 'text' })
  questionText: string;

  @ApiProperty({
    description: 'Formato o tipo de respuesta esperada para esta pregunta',
    enum: QuestionType,
    default: QuestionType.RATING,
    example: QuestionType.RATING,
  })
  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.RATING })
  type: QuestionType;

  @ApiProperty({
    description:
      'Indica si la pregunta está activa para mostrarse en nuevas encuestas',
    default: false,
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha y hora en que se creó el registro en el sistema',
    example: '2026-07-04T22:07:57.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
