import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Network } from 'src/networks/entities/network.entity';

@Entity()
export class Typenetwork {
  @ApiProperty({
    description: 'Identificador único del tipo de equipo de red (UUID)',
    example: 'c4a81b4f-96c2-4d11-8231-1823746de714',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la categoría del dispositivo de red',
    example: 'Switch',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description: 'Lista de dispositivos de red asociados a este tipo de equipo',
    type: () => [Network],
  })
  @OneToMany(() => Network, (network) => network.id_type_equipment_network, {
    onDelete: 'RESTRICT',
  })
  networks: Network[];

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
