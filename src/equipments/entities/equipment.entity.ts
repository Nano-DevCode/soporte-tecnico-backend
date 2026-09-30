import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToMany,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Model } from '../../models/entities/model.entity';
import { Printer } from 'src/printers/entities/printer.entity';
import { Computer } from 'src/computers/entities/computer.entity';
import { Network } from 'src/networks/entities/network.entity';
import { Responsibleequipment } from 'src/responsibleequipments/entities/responsibleequipment.entity';
import { Equipmenttype } from 'src/equipmenttypes/entities/equipmenttype.entity';
import { Department } from 'src/departments/entities/department.entity';
import { TechnicalReport } from 'src/technical-reports/entities/technical-report.entity';

@Entity()
export class Equipment {
  static id() {
    throw new Error('Method not implemented.');
  }

  @ApiProperty({
    description: 'Identificador único del activo de hardware global (UUID)',
    example: '8a4b81b4-96c2-4d11-8231-1823746de110',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Número de inventario o placa institucional único del equipo',
    example: 'ITO-CC-2026-0042',
  })
  @Column('text', { unique: true })
  num_inventario: string;

  @ApiProperty({
    description: 'Número de serie único del equipo',
    example: 'ITO-CC-2026-0042',
  })
  @Column('text', { unique: true, nullable: true })
  num_serial: string | null;

  @ApiProperty({
    description: 'Modelo específico asociado al equipo físico',
    type: () => Model,
  })
  @Index()
  @ManyToOne(() => Model, (model) => model.equipment)
  @JoinColumn({ name: 'id_model' })
  id_model: Model;

  @ApiPropertyOptional({
    description:
      'Especificaciones técnicas detalladas si el equipo es una Impresora',
    type: () => Printer,
  })
  @OneToOne(() => Printer, (printer) => printer.id_equipment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  printer: Printer;

  @ApiPropertyOptional({
    description:
      'Especificaciones técnicas detalladas si el equipo es una Computadora',
    type: () => Computer,
  })
  @OneToOne(() => Computer, (computer) => computer.id_equipment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  computer: Computer;

  @ApiPropertyOptional({
    description:
      'Especificaciones técnicas detalladas si el equipo es un Dispositivo de Red',
    type: () => Network,
  })
  @OneToOne(() => Network, (network) => network.id_equipment, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  network: Network;

  @ApiProperty({
    description:
      'Tipo de activo global (Computadora, Impresora o Red) con ID numérico',
    type: () => Equipmenttype,
  })
  @Index()
  @ManyToOne(() => Equipmenttype, (tipo_equipo) => tipo_equipo.equipments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_type_equipment' })
  id_type_equipment: Equipmenttype;

  @ApiProperty({
    description: 'Personal responsable asignado para la custodia del equipo',
    type: () => Responsibleequipment,
  })
  @Index()
  @ManyToOne(
    () => Responsibleequipment,
    (id_responsable) => id_responsable.equipo,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'id_responsable' })
  id_responsable: Responsibleequipment;

  @ApiProperty({
    description:
      'Departamento o área académica/administrativa donde se ubica el equipo',
    type: () => Department,
  })
  @Index()
  @ManyToOne(() => Department, (department) => department.equipment, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_departament' })
  id_departament: Department;

  @ApiProperty({
    description:
      'Estado operativo lógico del equipo en el sistema (Activo/Inactivo)',
    example: true,
    default: true,
  })
  @Column('boolean', { default: true })
  status: boolean;

  @ApiProperty({
    description:
      'Comentarios, observaciones generales o estado físico del equipo',
    example: 'Presenta ligero desgaste en carcasa, operativo al 100%.',
  })
  @Column('text')
  description: string;

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

  @ApiPropertyOptional({
    description:
      'Historial de dictámenes o reportes técnicos asociados al activo',
    type: () => [TechnicalReport],
  })
  @ManyToMany(
    () => TechnicalReport,
    (technicalReport) => technicalReport.equipments,
  )
  technical_reports: TechnicalReport[];
}
