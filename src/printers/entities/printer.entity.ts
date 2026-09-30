import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { Printerfunctiontype } from 'src/printerfunctiontypes/entities/printerfunctiontype.entity';
import { Printingtype } from 'src/printingtypes/entities/printingtype.entity';

@Entity()
export class Printer {
  @ApiProperty({
    description: 'Identificador único del registro de la impresora (UUID)',
    example: '3f2b81a4-96c2-4d11-8231-1823746de205',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Datos del equipo general (Equipo de Cómputo/Hardware) asociado',
    type: () => Equipment,
  })
  @OneToOne(() => Equipment, (equipment) => equipment.printer)
  @JoinColumn({ name: 'id_equipment' })
  id_equipment: Equipment;

  @ApiProperty({
    description:
      'Relación con la tecnología o tipo de impresión que utiliza el equipo',
    type: () => Printingtype,
  })
  @ManyToOne(() => Printingtype, (tipoImpresion) => tipoImpresion.printers)
  @JoinColumn({ name: 'id_type_printing' })
  id_type_printing: Printingtype;

  @ApiProperty({
    description: 'Relación con el tipo de función u operatividad del equipo',
    type: () => Printerfunctiontype,
  })
  @ManyToOne(() => Printerfunctiontype, (tipoFuncion) => tipoFuncion.printers)
  @JoinColumn({ name: 'id_type_function' })
  id_type_function: Printerfunctiontype;

  @ApiProperty({
    description:
      'Especifica si el equipo imprime a color (true) o solo en blanco y negro / monocromático (false)',
    example: false,
    default: false,
  })
  @Column('boolean', { default: false })
  color: boolean;

  @ApiProperty({
    description:
      'Modelo, código o especificación del tóner o cartucho de tinta compatible',
    example: 'HP 105A (W1105A) / Canon G-2100',
  })
  @Column('text')
  model_toner: string;

  // Ocultos en el esquema de Swagger por select: false de auditoría interna
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
