import {
  Entity,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { Typenetwork } from 'src/typenetworks/entities/typenetwork.entity';

@Entity()
export class Network {
  @ApiProperty({
    description: 'Identificador único del registro de red (UUID)',
    example: 'a4b81b4f-96c2-4d11-8231-1823746de825',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Relación OneToOne con los datos generales del inventario de Hardware',
    type: () => Equipment,
  })
  @OneToOne(() => Equipment, (equipment) => equipment.network, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_equipment' })
  id_equipment: Equipment;

  @ApiProperty({
    description:
      'Categoría o tipo de hardware de infraestructura de red (Switch, Router, AP)',
    type: () => Typenetwork,
  })
  @ManyToOne(() => Typenetwork, (tipoEquipoRed) => tipoEquipoRed.networks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_type_equipment_network' })
  id_type_equipment_network: Typenetwork;

  @ApiProperty({
    description: 'Cantidad total de puertos físicos que posee el dispositivo',
    example: 24,
  })
  @Column('int')
  number_ports: number;

  @ApiProperty({
    description: 'Especifica si el equipo soporta Power over Ethernet (PoE)',
    example: true,
    default: false,
  })
  @Column('boolean', { default: false })
  PoE: boolean;

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
