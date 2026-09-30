import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'src/documents/entities/document.entity';
import { Tag } from 'src/tags/entities/tag.entity';

export class DepartmentSimpleResponseDto {
  @ApiProperty({
    description: 'Nombre del departamento.',
    example: 'Departamento de Sistemas',
  })
  name: string;

  @ApiProperty({
    description: 'Identificador único del departamento (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;
}

export class UserSimpleResponseDto {
  @ApiProperty({
    description: 'Identificador único del usuario (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del usuario.',
    example: 'Juan Pérez García',
  })
  full_name: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    example: 'juan.perez@tecnm.mx',
  })
  email: string;

  @ApiProperty({
    description: 'Departamento al que pertenece el usuario.',
    type: DepartmentSimpleResponseDto,
    nullable: true,
  })
  department: DepartmentSimpleResponseDto | null;
}

export class IssueTypeResponseDto {
  @ApiProperty({
    description: 'Identificador único del tipo de problema.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del tipo de problema.',
    example: 'Falla de Hardware',
  })
  name: string;
}

export class SchoolPeriodSimpleReponseDto {
  @ApiProperty({
    description: 'Identificador único del periodo escolar (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del periodo escolar.',
    example: 'ENE-JUN 2026',
  })
  name: string;
}

export class TicketResponseDto {
  @ApiProperty({
    description: 'Identificador único del ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Folio público del ticket.',
    example: 'TICKET-2026A-0001',
  })
  folio: string;

  @ApiProperty({
    description: 'Folio interno del Centro de Cómpuoto para el ticket.',
    example: 'OT-2026-0001-PPP',
  })
  internal_folio: string;

  @ApiProperty({
    description: 'Estado actual del ticket.',
    example: 'En Proceso',
  })
  status: string;

  @ApiProperty({
    description: 'Código del estado actual.',
    example: 'IN_PROGRESS',
  })
  status_code: string;

  @ApiProperty({ description: 'Nivel de prioridad del ticket.', example: 1 })
  priority: number;

  @ApiProperty({
    description: 'Descripción del ticket.',
    example: 'El monitor no enciende.',
  })
  description: string;

  @ApiProperty({
    description: 'Jefe de departamento responsable.',
    type: UserSimpleResponseDto,
    nullable: true,
  })
  jefe_depto: UserSimpleResponseDto | null;

  @ApiProperty({
    description: 'Tipo de problema del ticket.',
    type: IssueTypeResponseDto,
    nullable: true,
  })
  issue_type: IssueTypeResponseDto | null;

  @ApiProperty({
    description: 'Periodo escolar asociado.',
    type: SchoolPeriodSimpleReponseDto,
    nullable: true,
  })
  school_period: SchoolPeriodSimpleReponseDto | null;

  @ApiProperty({
    description: 'Documentos adjuntos al ticket.',
    type: [Document],
  })
  documents: Document[];

  @ApiProperty({
    description: 'Fecha de creación del ticket.',
    example: '2026-07-12T17:30:00.000Z',
  })
  created_at: Date | string;

  @ApiProperty({ description: 'Etiquetas asignadas al ticket.', type: [Tag] })
  tags: Tag[];
}
