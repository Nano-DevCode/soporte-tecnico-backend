import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class IssueType {
  @ApiProperty({
    description: 'Identificador único del tipo de problema.',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre descriptivo del tipo de problema (único).',
    example: 'Error de Hardware',
  })
  @Column('text', {
    unique: true,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del tipo de problema.',
    example: 'Problemas relacionados con componentes físicos del equipo.',
  })
  @Column('text', {
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T15:33:03.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:33:03.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Lista de tickets asociados a este tipo de problema.',
    type: () => [Ticket],
  })
  @OneToMany(() => Ticket, (ticket) => ticket.issue_type, {
    onDelete: 'RESTRICT',
  })
  tickets: Ticket[];
}
