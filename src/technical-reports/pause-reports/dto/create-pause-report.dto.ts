import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePauseReportDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  diagnosis: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  justification: string;

  @IsUUID()
  @IsNotEmpty()
  ticketId: string;
}
