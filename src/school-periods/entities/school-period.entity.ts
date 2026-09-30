import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PeriodType {
  ENERO_JUNIO = 'enero-junio',
  VERANO = 'verano',
  AGOSTO_DICIEMBRE = 'agosto-diciembre',
}

export const PeriodSuffix: Record<PeriodType, string> = {
  [PeriodType.ENERO_JUNIO]: '1',
  [PeriodType.VERANO]: '2',
  [PeriodType.AGOSTO_DICIEMBRE]: '3',
};

@Entity()
@Check(`"date_start" < "date_end"`)
@Index('IDX_ONLY_ONE_ACTIVE_PERIOD', ['is_active'], {
  unique: true,
  where: '"is_active" = true',
})
export class SchoolPeriod {
  @ApiProperty({
    description: 'Identificador único del periodo escolar (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Nombre identificador único del periodo (generado automáticamente).',
    example: '20261',
  })
  @Column('text', {
    unique: true,
  })
  name: string;

  @ApiProperty({
    description: 'Tipo de periodo escolar.',
    enum: PeriodType,
    example: PeriodType.ENERO_JUNIO,
  })
  @Column({
    type: 'enum',
    enum: PeriodType,
  })
  period_type: PeriodType;

  @ApiProperty({
    description: 'Fecha de inicio del periodo escolar.',
    example: '2026-01-05T08:00:00.000Z',
  })
  @Column('timestamptz')
  date_start: Date;

  @ApiProperty({
    description: 'Fecha de fin del periodo escolar.',
    example: '2026-06-30T18:00:00.000Z',
  })
  @Column('timestamptz')
  date_end: Date;

  @ApiProperty({
    description: 'Indica si este periodo está activo actualmente.',
    default: false,
  })
  @Column('boolean', { default: false })
  is_active: boolean;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T16:16:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T16:16:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Lista de tickets asociados a este periodo escolar.',
    type: () => [Ticket],
  })
  @OneToMany(() => Ticket, (ticket) => ticket.school_period, {
    onDelete: 'RESTRICT',
  })
  tickets: Ticket[];

  @BeforeInsert()
  @BeforeUpdate()
  generateName() {
    if (this.period_type && this.date_start) {
      const year = new Date(this.date_start).getFullYear();

      const suffix = PeriodSuffix[this.period_type];

      this.name = `${year}${suffix}`;
    }
  }
}
