import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsInvoice } from 'src/it-assets-invoices/entities/it-assets-invoice.entity';
import { ItAssetsModel } from 'src/it-assets-models/entities/it-assets-model.entity';
import { ItAssetsMovement } from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { ItAssetsType } from 'src/it-assets-type/entities/it-assets-type.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Entity,
  OneToMany,
  Index,
} from 'typeorm';

@Entity()
export class ItAsset {
  @ApiProperty({
    description: 'Identificador único del activo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({
    description: 'Identificador o folio interno de inventario',
    example: 'INV-2026-001',
  })
  @Index()
  @Column('text', {
    unique: true,
    nullable: true,
  })
  idInventary!: string;

  @ApiPropertyOptional({
    description: 'Número de serie del fabricante',
    example: 'SN-9876543210',
  })
  @Index()
  @Column('text', {
    nullable: true,
    unique: true,
  })
  serialNumber!: string;

  @ApiProperty({
    description:
      'Estado lógico del activo (true = activo/visible, false = inactivo/baja)',
    example: true,
    default: true,
  })
  @Column('boolean', {
    default: true,
  })
  status!: boolean;

  @ApiProperty({
    description: 'Indica si el activo está actualmente asignado o en uso',
    example: false,
    default: false,
  })
  @Column('boolean', {
    default: false,
  })
  inUse!: boolean;

  @ApiPropertyOptional({
    description: 'Descripción física o detalles adicionales del equipo',
    example: 'Monitor rayado en la esquina superior derecha',
  })
  @Column('text', {
    nullable: true,
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'Nombre o denominación del activo',
    example: 'Monitor Dell',
  })
  @Index()
  @Column('text', {
    nullable: true,
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen del activo',
    example: '/files/it-assets-images/monitor-dell.webp',
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

  @ApiProperty({ type: () => ItAssetsModel })
  @Index()
  @ManyToOne(() => ItAssetsModel, (itAssetsModel) => itAssetsModel.itAssets)
  @JoinColumn()
  model!: ItAssetsModel;

  @ApiProperty({ type: () => ItAssetsStatus })
  @Index()
  @ManyToOne(() => ItAssetsStatus, (itAssetsStatus) => itAssetsStatus.itAssets)
  @JoinColumn()
  itAssetStatus!: ItAssetsStatus;

  @ApiProperty({ type: () => ItAssetsType })
  @Index()
  @ManyToOne(() => ItAssetsType, (itAssetsType) => itAssetsType.itAssets)
  @JoinColumn()
  itAssetsType!: ItAssetsType;

  @ApiPropertyOptional({ type: () => ItAssetsInvoice })
  @Index()
  @ManyToOne(
    () => ItAssetsInvoice,
    (itAssetsInvoice) => itAssetsInvoice.itAssets,
    {
      nullable: true,
    },
  )
  @JoinColumn()
  invoice!: ItAssetsInvoice;

  @ApiPropertyOptional({ type: () => [ItAssetsMovement] })
  @OneToMany(
    () => ItAssetsMovement,
    (itAssetsMovement) => itAssetsMovement.itAsset,
  )
  movements!: ItAssetsMovement[];
}
