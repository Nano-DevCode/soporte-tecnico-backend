import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Printer } from '../../entities/printer.entity';

@Entity()
export class Printingtype {
  @ApiProperty({
    description: 'Identificador único del tipo de impresión (UUID)',
    example: '8a4f21b3-46c1-4b11-9231-1823746cd102',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre descriptivo del tipo de impresión',
    example: 'Inyección de Tinta',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description: 'Lista de impresoras asociadas a este tipo de impresión',
    type: () => [Printer],
  })
  @OneToMany(() => Printer, (printer) => printer.id_type_printing, {
    onDelete: 'RESTRICT',
  })
  printers: Printer[];

  // Ocultos de Swagger ya que son columnas de auditoría interna
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
