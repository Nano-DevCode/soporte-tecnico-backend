import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Consumable } from 'src/consumables/entities/consumable.entity';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { FaultValidity } from 'src/fault-validities/entities/fault-validity.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TechnicalReport {
  @ApiProperty({
    description: 'Identificador único de la bitácora técnica (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Diagnóstico técnico del problema.',
    example: 'Fallo en la tarjeta madre debido a una sobrecarga eléctrica.',
  })
  @Column('text')
  diagnosis: string;

  @ApiProperty({
    description: 'Descripción del trabajo realizado.',
    example: 'Sustitución de componentes quemados y limpieza de circuitos.',
  })
  @Column('text')
  work_performed: string;

  @ApiPropertyOptional({
    description:
      'Otros Materiales utilizados durante la reparación, aparte de los registrados en el inventario.',
    example: 'Soldadura de estaño, tarjeta madre de repuesto.',
  })
  @Column('text', {
    nullable: true,
  })
  materials_used?: string;

  @ApiProperty({
    description: 'Indica si el problema fue resuelto.',
    example: true,
  })
  @Column('boolean')
  is_resolved: boolean;

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `setweight(to_tsvector('spanish', unaccent_immutable(coalesce(work_performed, ''))), 'A') || setweight(to_tsvector('spanish', unaccent_immutable(coalesce(diagnosis, ''))), 'B')`,
    select: false,
    insert: false,
    update: false,
    nullable: true,
  })
  textsearchable_index_col: string;

  @ApiProperty({
    description: 'Fecha y hora de creación de la bitácora.',
    example: '2026-07-12T16:36:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización de la bitácora.',
    example: '2026-07-12T16:36:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Naturaleza de la falla asociada a la bitácora.',
    type: () => FaultValidity,
  })
  @Index()
  @ManyToOne(() => FaultValidity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  fault_validity: FaultValidity;

  @ApiProperty({
    description: 'Ticket al cual corresponde esta bitácora.',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.technical_reports, {
    onDelete: 'RESTRICT',
  })
  ticket: Ticket;

  @ApiProperty({
    description: 'Equipos involucrados en esta bitácora técnica.',
    type: () => [Equipment],
  })
  @ManyToMany(() => Equipment, (equipo) => equipo.technical_reports, {
    onDelete: 'RESTRICT',
  })
  @JoinTable()
  equipments: Equipment[];

  @ApiProperty({
    description: 'Consumibles utilizados en este reporte técnico.',
    type: () => [Consumable],
  })
  @ManyToMany(() => Consumable, (consumable) => consumable.technical_reports)
  @JoinTable({
    name: 'technical_report_consumables',
    joinColumn: { name: 'id_technical_report', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_consumable', referencedColumnName: 'id' },
  })
  consumables: Consumable[];
}
