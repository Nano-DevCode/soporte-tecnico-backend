import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsPositive,
  IsInt,
} from 'class-validator';
import { CreateTechnicalReportDto } from 'src/technical-reports/dto/create-technical-report.dto';

export class InterveneTicketDto extends OmitType(CreateTechnicalReportDto, [
  'ticketId',
] as const) {
  @ApiPropertyOptional({
    description: 'Lista de etiquetas a aplicar o actualizar en el ticket.',
    type: [String],
    example: ['mantenimiento', 'urgente'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Identificador del tipo de problema.',
    example: 1,
  })
  @IsPositive()
  @IsInt()
  @IsOptional()
  issue_type?: number;
}
