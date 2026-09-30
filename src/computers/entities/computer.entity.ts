import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { Computerequipmenttype } from 'src/computerequipmenttypes/entities/computerequipmenttype.entity';
import { Storagetype } from 'src/storagetypes/entities/storagetype.entity';
import { Operatingsystem } from 'src/operatingsystems/entities/operatingsystem.entity';
import { Computerprocessor } from 'src/computerprocessors/entities/computerprocessor.entity';

@Entity()
export class Computer {
  @ApiProperty({
    description:
      'Identificador único de las especificaciones de la computadora (UUID)',
    example: '2b4e81a4-96c2-4d11-8231-1823746de301',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Relación OneToOne con los datos generales del inventario de Hardware',
    type: () => Equipment,
  })
  @OneToOne(() => Equipment, (equipment) => equipment.computer)
  @JoinColumn({ name: 'id_equipment' })
  id_equipment: Equipment;

  @ApiProperty({
    description:
      'Tipo o factor de forma del equipo de cómputo (Laptop, Escritorio, Servidor)',
    type: () => Computerequipmenttype,
  })
  @ManyToOne(
    () => Computerequipmenttype,
    (tipoEquipo) => tipoEquipo.type_equipment_computer,
  )
  @JoinColumn({ name: 'id_type_equipment_computer' })
  id_type_equipment_computer: Computerequipmenttype;

  @ApiProperty({
    description:
      'Tipo de tecnología de la unidad de almacenamiento principal (SSD, HDD)',
    type: () => Storagetype,
  })
  @ManyToOne(
    () => Storagetype,
    (tipoAlmacenamiento) => tipoAlmacenamiento.type_storage,
  )
  @JoinColumn({ name: 'id_type_storage' })
  id_type_storage: Storagetype;

  @ApiProperty({
    description: 'Sistema operativo y edición instalado en el equipo',
    type: () => Operatingsystem,
  })
  @ManyToOne(
    () => Operatingsystem,
    (sistemaoperativo) => sistemaoperativo.operating_system,
  )
  @JoinColumn({ name: 'id_type_operating_system' })
  id_type_operating_system: Operatingsystem;

  @ApiProperty({
    description: 'Procesador (CPU) que tiene integrado la computadora',
    type: () => Computerprocessor,
  })
  @ManyToOne(
    () => Computerprocessor,
    (procesadorcomputadora) => procesadorcomputadora.id_processor,
  )
  @JoinColumn({ name: 'id_processor' })
  id_processor: Computerprocessor;

  @ApiProperty({
    description: 'Capacidad total y tipo de Memoria RAM configurada',
    example: '16 GB DDR4 3200MHz',
  })
  @Column('text')
  ram: string;

  @ApiProperty({
    description: 'Capacidad total de almacenamiento de fábrica',
    example: '512 GB',
  })
  @Column('text')
  capacity_storage: string;

  @ApiProperty({
    description: 'Espacio de almacenamiento libre o disponible actual',
    example: '240 GB',
  })
  @Column('text')
  available_storage: string;

  // Columnas de auditoría interna ocultas del esquema público de respuestas de Swagger
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
