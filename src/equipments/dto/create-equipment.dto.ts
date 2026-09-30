import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CreateComputerDto } from 'src/computers/dto/create-computer.dto';
import { CreatePrinterDto } from 'src/printers/dto/create-printer.dto';
import { CreateNetworkDto } from 'src/networks/dto/create-network.dto';

export class CreateEquipmentDto {
  @ApiProperty({
    description:
      'Código identificador único o placa de inventario institucional',
    example: 'ITO-CC-2026-0042',
    minLength: 3,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  num_inventario: string;

  @ApiProperty({
    description:
      'Código identificador único o placa de inventario institucional',
    example: 'ITO-CC-2026-0042',
    minLength: 3,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MaxLength(350, { message: i18nValidationMessage('validation.maxLength') })
  num_serial?: string | null;

  @ApiProperty({
    description: 'UUID del modelo de hardware asociado (Catálogo Models)',
    example: '3b9e81b4-96c2-4d11-8231-1823746de941',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isDefined') })
  id_model: string;

  @ApiProperty({
    description:
      'ID numérico del tipo raíz del equipo (1 para Computadora, 2 para Impresora, 3 para Red)',
    example: 1,
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isDefined') })
  id_type_equipment: number;

  @ApiProperty({
    description:
      'UUID del personal encargado o responsable del resguardo del bien',
    example: 'e3b07384-e223-4956-a5e2-bb51263c4599',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isDefined') })
  id_responsable?: string;

  @ApiProperty({
    description:
      'UUID del departamento físico o de adscripción donde operará el activo',
    example: 'c9b07384-e223-4956-a5e2-bb51263c4501',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isDefined') })
  id_departament?: string;

  @ApiProperty({
    description:
      'Establece si el equipo inicia activo u operativo en el sistema',
    example: true,
    default: true,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  status: boolean;

  @ApiProperty({
    description:
      'Descripción complementaria sobre el estado, accesorios o notas de entrega',
    example:
      'Equipo asignado al laboratorio de sistemas, incluye cargador original.',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  description: string;

  @ApiPropertyOptional({
    description:
      'Bloque con las especificaciones de hardware de computadora. Mandar solo si id_type_equipment corresponde',
    type: CreateComputerDto,
  })
  @ValidateNested()
  @Type(() => CreateComputerDto)
  computer?: CreateComputerDto;

  @ApiPropertyOptional({
    description:
      'Bloque con las especificaciones técnicas de impresora. Mandar solo si id_type_equipment corresponde',
    type: CreatePrinterDto,
  })
  @ValidateNested()
  @Type(() => CreatePrinterDto)
  printer?: CreatePrinterDto;

  @ApiPropertyOptional({
    description:
      'Bloque con las especificaciones de infraestructura de red. Mandar solo si id_type_equipment corresponde',
    type: CreateNetworkDto,
  })
  @ValidateNested()
  @Type(() => CreateNetworkDto)
  network?: CreateNetworkDto;
}
