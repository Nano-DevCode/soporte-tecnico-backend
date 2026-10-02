import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from '../../entities/equipment.entity';

@Entity()
export class Equipmenttype {
  @ApiProperty({
    description:
      'Identificador único numérico del tipo de equipo (ID Autoincremental)',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre o categoría principal del tipo de activo de hardware',
    example: 'Computadora',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description:
      'Colección de equipos de inventario vinculados a este tipo de activo global',
    type: () => [Equipment],
  })
  @OneToMany(() => Equipment, (equipment) => equipment.id_type_equipment)
  equipments: Equipment[];

  // Columnas de auditoría interna con select: false ocultas del esquema público de Swagger
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
