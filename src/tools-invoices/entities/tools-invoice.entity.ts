import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tool } from 'src/tools/entities/tool.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ToolsInvoice {
  @ApiProperty({
    description: 'Identificador único de la factura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({
    description: 'Identificador, folio o número interno de la factura',
    example: 'FAC-HER-2026',
  })
  @Column('text', {
    unique: true,
    nullable: true,
  })
  idInternal!: string;

  // No documentados en Swagger por tener select: false
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Lista de herramientas asociadas a esta factura',
    type: () => [Tool],
  })
  @OneToMany(() => Tool, (tool) => tool.invoice)
  @JoinColumn()
  itAssets!: string;
}
