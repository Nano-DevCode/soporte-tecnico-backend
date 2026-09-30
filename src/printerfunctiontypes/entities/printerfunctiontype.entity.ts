import {
  Entity,
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Printer } from 'src/printers/entities/printer.entity';

@Entity()
export class Printerfunctiontype {
  @ApiProperty({
    description: 'Identificador único del tipo de función de impresora (UUID)',
    example: 'd3b07384-d113-4956-a5e2-aa51263c4573',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la función del equipo',
    example: 'Multifuncional',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description: 'Lista de impresoras vinculadas a este tipo de función',
    type: () => [Printer],
  })
  @OneToMany(() => Printer, (printer) => printer.id_type_function)
  printers: Printer[];

  // Columnas de auditoría con select: false ocultas de la documentación pública de esquemas
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
