import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsMovementsIn } from 'src/tools-movements-in/entities/tools-movements-in.entity';
import { ToolsMovementsOut } from 'src/tools-movements-out/entities/tools-movements-out.entity';
import { Tool } from 'src/tools/entities/tool.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ToolsStatus {
  @ApiProperty({
    description: 'Identificador único del estado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description:
      'Nombre del estado físico u operativo (Ej. BUENO, REGULAR, DAÑADO)',
    example: 'BUENO',
  })
  @Column('text', {
    unique: true,
    nullable: false,
  })
  name!: string;

  @ApiProperty({
    description: 'Descripción detallada de lo que implica este estado',
    example:
      'La herramienta se encuentra en óptimas condiciones y operando correctamente.',
  })
  @Column('text', {
    nullable: false,
  })
  description!: string;

  @ApiPropertyOptional({
    description:
      'Lista de herramientas que actualmente tienen asignado este estado',
    type: () => [Tool],
  })
  @OneToMany(() => Tool, (tool) => tool.toolStatus)
  @JoinColumn()
  tools!: Tool[];

  @ApiPropertyOptional({
    description:
      'Historial de movimientos de entrada registrados con este estado',
    type: () => [ToolsMovementsIn],
  })
  @OneToMany(() => ToolsMovementsIn, (movementIn) => movementIn.toolsStatus)
  movementIn!: ToolsMovementsIn[];

  @ApiPropertyOptional({
    description:
      'Historial de movimientos de salida registrados con este estado',
    type: () => [ToolsMovementsOut],
  })
  @OneToMany(() => ToolsMovementsOut, (movementOut) => movementOut.toolStatus)
  movementOut!: ToolsMovementsOut[];
}
