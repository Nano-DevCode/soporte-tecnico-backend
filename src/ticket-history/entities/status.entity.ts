import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketHistory } from './ticket-history.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Status {
  @ApiProperty({
    description: 'Identificador único del estado.',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre legible del estado.',
    example: 'Recibida',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description:
      'Código único para identificar el estado (ej. REIBIDA, FINALIZADA).',
    example: 'RECIBIDA',
  })
  @Column('text', { unique: true })
  code: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T16:47:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T16:47:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Lista de historiales de tickets que contienen este estado.',
    type: () => [TicketHistory],
  })
  @OneToMany(() => TicketHistory, (ticket_history) => ticket_history.status, {
    onDelete: 'RESTRICT',
  })
  ticket_histories?: TicketHistory[];
}
