import { ConsumableMovement } from 'src/consumable-movements/entities/consumable-movement.entity';
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
export class MovementAplication {
  @ApiProperty({
    description:
      'Identificador único numérico autoincremental de la aplicación del movimiento',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description:
      'Nombre o descripción de la entidad, área o destino donde se aplica el insumo',
    example: 'Centro de Cómputo',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description: 'Acrónimo o clave corta única asociada a la aplicación',
    example: 'CC',
  })
  @Column('text', { unique: true })
  acronym: string;

  @ApiPropertyOptional({
    description:
      'Colección de transacciones o movimientos de consumibles vinculados a esta aplicación',
    type: () => [ConsumableMovement],
  })
  @OneToMany(
    () => ConsumableMovement,
    (consumablemovements) => consumablemovements.id_movement_aplication,
    { onDelete: 'RESTRICT' },
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
