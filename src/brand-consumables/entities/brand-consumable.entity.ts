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
export class BrandConsumable {
  @ApiProperty({
    description: 'Identificador único de la marca del consumible (UUID)',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre comercial del fabricante de consumibles',
    example: 'Xerox',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description: 'Colección de consumibles que pertenecen a este fabricante',
    type: () => [Consumable],
  })
  @OneToMany(() => Consumable, (consumable) => consumable.id_brand_consumable, {
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
