import { Consumable } from 'src/consumables/entities/consumable.entity';
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
export class Typeconsumable {
  @ApiProperty({
    description:
      'Identificador único numérico autoincremental del tipo de consumible',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre único que clasifica la categoría de insumos',
    example: 'Tóner',
  })
  @Column('text', { unique: true })
  name: string;

  @ApiPropertyOptional({
    description:
      'Colección de consumibles que pertenecen a este tipo de insumo',
    type: () => [Consumable],
  })
  @OneToMany(() => Consumable, (consumable) => consumable.id_type_consumable, {
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
