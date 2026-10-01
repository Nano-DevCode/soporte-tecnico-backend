import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsModel } from 'src/tools/models/entities/tools-model.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ToolsBrand {
  @ApiProperty({
    description: 'Identificador único de la marca',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre de la marca (Ej. BOSCH, DEWALT, MAKITA)',
    example: 'DEWALT',
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
    description: 'Lista de modelos pertenecientes a esta marca',
    type: () => [ToolsModel],
  })
  @OneToMany(() => ToolsModel, (toolsModel) => toolsModel.brand)
  models!: ToolsModel[];
}
