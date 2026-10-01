import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tool } from 'src/tools/entities/tool.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ToolsType {
  @ApiProperty({
    description: 'Identificador único del tipo de herramienta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description:
      'Nombre de la categoría o tipo de herramienta (Ej. ELÉCTRICA, MANUAL, MEDICIÓN)',
    example: 'ELÉCTRICA',
  })
  @Column('text', {
    unique: true,
  })
  name!: string;

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
    description: 'Lista de herramientas físicas que pertenecen a este tipo',
    type: () => [Tool],
  })
  @OneToMany(() => Tool, (tool) => tool.toolType)
  tools!: Tool[];
}
