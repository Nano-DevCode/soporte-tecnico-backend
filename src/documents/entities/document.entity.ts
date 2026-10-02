import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { TypeDocument } from '../types/entities/type-document.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Document {
  @ApiProperty({
    description: 'Identificador único del documento (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Dirección de Minio en donde se encuentra almacenado el documento.',
    example: '/files/pdfs-request/IEE-20262-0023.pdf',
  })
  @Column('text')
  url: string;

  @ApiProperty({
    description: 'Nombre del archivo o documento.',
    example: 'reporte_tecnico.pdf',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T15:23:20.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:23:20.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // @ApiProperty({
  //   description: 'Ticket al cual está relacionado este documento.',
  //   type: () => Ticket,
  // })
  @ApiHideProperty()
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.documents, {
    onDelete: 'RESTRICT',
  })
  ticket: Ticket;

  @ApiProperty({
    description: 'Tipo de documento al que pertenece este archivo.',
    type: () => TypeDocument,
  })
  @Index()
  @ManyToOne(() => TypeDocument, (type_document) => type_document.documents, {
    onDelete: 'RESTRICT',
  })
  type_document: TypeDocument;
}
