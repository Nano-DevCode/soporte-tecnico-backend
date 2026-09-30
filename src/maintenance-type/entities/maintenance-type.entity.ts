import { ApiProperty } from '@nestjs/swagger';
import { Response } from 'src/responses/entities/response.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MaintenanceType {
  @ApiProperty({
    description: 'Identificador único del tipo de mantenimiento (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del tipo de mantenimiento (único).',
    example: 'Interno',
  })
  @Column('text', {
    unique: true,
  })
  name: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T15:35:10.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:35:10.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Lista de respuestas asociadas a este tipo de mantenimiento.',
    type: () => [Response],
  })
  @OneToMany(() => Response, (response) => response.maintenance_type, {
    onDelete: 'RESTRICT',
  })
  reports: Response[];
}
