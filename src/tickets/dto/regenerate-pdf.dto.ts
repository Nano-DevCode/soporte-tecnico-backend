import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum DocumentType {
  REQUEST = 'request',
  RESPONSE = 'response',
}

export class RegeneratePdfDto {
  @ApiProperty({
    description: 'Tipo de documento a regenerar (request o response)',
    enum: DocumentType,
    example: DocumentType.REQUEST,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;
}
