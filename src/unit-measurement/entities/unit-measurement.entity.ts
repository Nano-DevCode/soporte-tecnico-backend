import { Consumable } from '../../consumables/entities/consumable.entity';
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
export class UnitMeasurement {
  @ApiProperty({
    description:
      'Identificador único numérico autoincremental de la unidad de medida',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description:
      'Nombre o magnitud de la unidad utilizada para cuantificar los insumos',
    example: 'Pieza',
  })
  @Column('text', { unique: true })
  name: string;

  @ApiPropertyOptional({
    description:
      'Colección de consumibles que son cuantificados bajo esta unidad de medida',
    type: () => [Consumable],
  })
  @OneToMany(() => Consumable, (consumable) => consumable.id_unit_measurement, {
    onDelete: 'RESTRICT',
  })
  consumable: Consumable[];

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
