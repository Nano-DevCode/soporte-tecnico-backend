import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Document } from '../../entities/document.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TypeDocument {
  @ApiProperty({
    description: 'Identificador único del tipo de documento.',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre del tipo de documento (único).',
    example: 'Orden de trabajo',
  })
  @Column('text', {
    unique: true,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del tipo de documento.',
    example: 'Documento legal para validar la identidad del usuario.',
  })
  @Column('text', {
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T17:05:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T17:05:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // @ApiProperty({
  //   description: 'Lista de documentos asociados a este tipo.',
  //   type: () => [Document],
  // })
  @ApiHideProperty()
  @OneToMany(() => Document, (document) => document.type_document, {
    onDelete: 'RESTRICT',
  })
  documents: Document[];
}
