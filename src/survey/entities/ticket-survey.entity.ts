import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Column,
} from 'typeorm';

export interface AnswerSnapshot {
  questionId: string;
  questionText: string;
  type: 'RATING' | 'TEXT';
  value: number | string;
}

@Entity('ticket_surveys')
export class TicketSurvey {
  @ApiProperty({
    description: 'Identificador único de la encuesta de ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Ticket al cual está asociada esta encuesta.',
    type: () => Ticket,
  })
  @OneToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ApiProperty({
    description: 'Conjunto de respuestas de la encuesta en formato JSON.',
    example: [
      {
        questionId: 'q1',
        questionText: '¿Cómo califica el servicio?',
        type: 'RATING',
        value: 5,
      },
    ],
  })
  @Column({ type: 'jsonb', default: [] })
  answers: AnswerSnapshot[];

  @ApiProperty({
    description: 'Fecha y hora de creación de la encuesta.',
    example: '2026-07-12T16:28:29.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
