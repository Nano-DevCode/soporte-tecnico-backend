import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsBrand } from 'src/tools/brands/entities/tools-brand.entity';
import { Tool } from 'src/tools/entities/tool.entity';
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
export class ToolsModel {
  @ApiProperty({
    description: 'Identificador único del modelo de herramienta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre o código del modelo',
    example: 'DCD771C2',
  })
  @Column('text')
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

  @ApiProperty({
    description: 'Marca a la que pertenece este modelo',
    type: () => ToolsBrand,
  })
  @Index()
  @ManyToOne(() => ToolsBrand, (toolsBrand) => toolsBrand.models, {
    eager: true,
    nullable: false,
  })
  @JoinColumn()
  brand!: ToolsBrand;

  @ApiPropertyOptional({
    description: 'Lista de herramientas físicas que pertenecen a este modelo',
    type: () => [Tool],
  })
  @OneToMany(() => Tool, (tool) => tool.model)
  tools!: Tool[];
}
