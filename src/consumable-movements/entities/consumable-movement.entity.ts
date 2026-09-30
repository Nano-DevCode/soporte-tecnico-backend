import { Batchesproduct } from 'src/batchesproducts/entities/batchesproduct.entity';
import { Department } from 'src/departments/entities/department.entity';
import { MovementAplication } from 'src/movement_aplications/entities/movement_aplication.entity';
import { MovementType } from 'src/movement_types/entities/movement_type.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class ConsumableMovement {
  @ApiProperty({
    description: 'Identificador único del movimiento de consumible (UUID)',
    example: 'd4b07384-e223-4956-a5e2-bb51263c4599',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Lote del producto afectado por este movimiento',
    type: () => Batchesproduct,
  })
  @Index()
  @ManyToOne(
    () => Batchesproduct,
    (batchesproduct) => batchesproduct.consumableMovements,
  )
  @JoinColumn({ name: 'id_batches_product' })
  id_batches_product: Batchesproduct;

  @ApiProperty({
    description: 'Tipo de movimiento (Ej. Entrada o Salida)',
    type: () => MovementType,
  })
  @Index()
  @ManyToOne(
    () => MovementType,
    (movementtype) => movementtype.consumableMovements,
  )
  @JoinColumn({ name: 'id_movement_type' })
  id_movement_type: MovementType;

  @ApiProperty({
    description: 'Aplicación o destino específico del movimiento',
    type: () => MovementAplication,
  })
  @Index()
  @ManyToOne(
    () => MovementAplication,
    (movementaplication) => movementaplication.consumableMovements,
  )
  @JoinColumn({ name: 'id_movement_aplication' })
  id_movement_aplication: MovementAplication;

  @ApiPropertyOptional({
    description: 'Ticket de soporte técnico vinculado (si aplica)',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.consumable_movement)
  @JoinColumn({ name: 'id_ticket' })
  id_ticket: Ticket;

  @ApiPropertyOptional({
    description: 'Departamento solicitante o destino del insumo',
    type: () => Department,
  })
  @Index()
  @ManyToOne(() => Department, (department) => department.consumableMovements)
  @JoinColumn({ name: 'id_departament_consumable' })
  id_departament_consumable: Department;

  @ApiProperty({
    description:
      'Código de control progresivo o identificador de la aplicación del movimiento',
    example: 'CC-OUT-0045',
  })
  @Column('text')
  code_movement_aplication: string;

  @ApiProperty({
    description:
      'Cantidad de unidades o fracciones de consumible transaccionadas',
    example: 2,
  })
  @Column('int')
  quantity_consumable: number;

  @ApiProperty({
    description:
      'Notas detalladas u observaciones sobre el motivo o estado del movimiento',
    example: 'Despacho de tóner solicitado para la impresora de la jefatura.',
  })
  @Column('text')
  observations: string;

  @ApiProperty({
    description:
      'Costo financiero total calculado para este movimiento específico (quantity_consumable × cost_unit del lote)',
    example: 900.0,
  })
  @Column('decimal', { precision: 16, scale: 4 })
  movement_cost: number;

  @ApiProperty({
    description:
      'Fecha y hora exacta en la que se efectuó la transacción en el almacén',
    example: '2026-07-01T16:20:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // Auditoría oculta del esquema público de serialización
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  updated_at: Date;
}
