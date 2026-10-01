import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsInvoice } from 'src/tools/invoices/entities/tools-invoice.entity';
import { ToolsModel } from 'src/tools/models/entities/tools-model.entity';
import { ToolsMovement } from 'src/tools/movements/entities/tools-movement.entity';
import { ToolsStatus } from 'src/tools/status/entities/tools-status.entity';
import { ToolsType } from 'src/tools/types/entities/tools-type.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Tool {
  @ApiProperty({
    description: 'Identificador único de la herramienta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({
    description:
      'Identificador o folio interno de inventario para esta herramienta',
    example: 'HER-2026-001',
  })
  @Index()
  @Column('text', {
    unique: true,
    nullable: true,
  })
  idInventary!: string;

  @ApiProperty({
    description:
      'Estado lógico de la herramienta (true = activo/visible, false = inactivo/baja)',
    example: true,
    default: true,
  })
  @Column('boolean', {
    default: true,
  })
  status!: boolean;

  @ApiProperty({
    description: 'Indica si la herramienta está actualmente asignada o en uso',
    example: false,
    default: false,
  })
  @Column('boolean', {
    default: false,
  })
  inUse!: boolean;

  @ApiPropertyOptional({
    description: 'Descripción física o detalles adicionales de la herramienta',
    example: 'Taladro percutor de 1/2 pulgada con desgaste en la carcasa',
  })
  @Column('text', {
    nullable: true,
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'Nombre o denominación de la herramienta',
    example: 'Taladro Bosch',
  })
  @Index()
  @Column('text', {
    nullable: true,
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen de la herramienta',
    example: '/files/tools-images/taladro-bosch.webp',
  })
  @Column('text', {
    nullable: true,
  })
  imageUrl!: string;

  @ApiProperty({ description: 'Fecha de registro en el sistema' })
  @Index()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de la última modificación' })
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt!: Date;

  @ApiProperty({ type: () => ToolsModel })
  @Index()
  @ManyToOne(() => ToolsModel, (toolsModel) => toolsModel.tools)
  @JoinColumn()
  model!: ToolsModel;

  @ApiProperty({ type: () => ToolsStatus })
  @Index()
  @ManyToOne(() => ToolsStatus, (toolStatus) => toolStatus.tools)
  @JoinColumn()
  toolStatus!: ToolsStatus;

  @ApiProperty({ type: () => ToolsType })
  @Index()
  @ManyToOne(() => ToolsType, (toolType) => toolType.tools)
  @JoinColumn()
  toolType!: ToolsType;

  @ApiPropertyOptional({ type: () => ToolsInvoice })
  @Index()
  @ManyToOne(() => ToolsInvoice, (toolsInvoice) => toolsInvoice.itAssets, {
    nullable: true,
  })
  @JoinColumn()
  invoice!: ToolsInvoice | null;

  @ApiPropertyOptional({ type: () => [ToolsMovement] })
  @OneToMany(() => ToolsMovement, (toolsMovement) => toolsMovement.tool)
  movements!: ToolsMovement[];
}
