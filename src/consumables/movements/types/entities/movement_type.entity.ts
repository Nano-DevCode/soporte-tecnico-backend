import { ConsumableMovement } from 'src/consumables/movements/entities/consumable-movement.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class MovementType {
  @ApiProperty({
    description:
      'Identificador único numérico autoincremental del tipo de movimiento',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre o concepto del movimiento de almacén',
    example: 'Salida por mantenimiento preventivo',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description:
      'Colección de movimientos o transacciones de consumibles asociadas a esta clasificación',
    type: () => [ConsumableMovement],
  })
  @OneToMany(
    () => ConsumableMovement,
    (consumablemovements) => consumablemovements.id_movement_type,
    {
      onDelete: 'RESTRICT',
    },
  )
  consumableMovements: ConsumableMovement[];

  // Columnas de auditoría interna ocultas del esquema público con select: false
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  updated_at: Date;
}
