import {
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Consumable } from 'src/consumables/entities/consumable.entity';

@Entity()
export class ConsumableUbication {
  @ApiProperty({
    description: 'Identificador único de la ubicación del consumible (UUID)',
    example: 'd3b07384-e223-4956-a5e2-bb51263c4510',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Nombre o descripción de la ubicación física o estante de almacenamiento',
    example: 'Estante A - Almacén Central',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description: 'Colección de consumibles almacenados en esta ubicación',
    type: () => [Consumable],
  })
  @OneToMany(
    () => Consumable,
    (consumable) => consumable.id_ubication_consumable,
    {
      onDelete: 'RESTRICT',
    },
  )
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
