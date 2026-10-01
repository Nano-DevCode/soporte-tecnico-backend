import { ApiProperty } from '@nestjs/swagger';
import { Staff } from './staff.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('technician_kpis')
export class TechnicianKpi {
  @ApiProperty({
    description: 'Identificador único del registro de KPI (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 15 })
  @Column('int', { default: 0 })
  total_assigned!: number;

  @ApiProperty({ example: 10 })
  @Column('int', { default: 0 })
  total_resolved!: number;

  @ApiProperty({ example: 5 })
  @Column('int', { default: 0 })
  pending_tickets!: number;

  @ApiProperty({ example: 95.5 })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  effectiveness_rate!: number;

  @ApiProperty({
    description: 'Tiempo promedio de resolución en horas.',
    example: 2.5,
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  avg_resolution_hours!: number;

  // Hacemos el foreign key explícito para facilitar el "Upsert" (Actualizar/Insertar)
  @Column('uuid')
  @Index({ unique: true })
  staffId!: string;

  @ApiProperty({
    description: 'Técnico al que pertenece esta métrica.',
    type: () => Staff,
  })
  @OneToOne(() => Staff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'staffId' })
  staff!: Staff;

  @ApiProperty({
    description: 'Fecha en la que se calculó esta métrica por última vez.',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  last_calculated_at!: Date;
}
