import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangeDepartmentStatusDto {
  @ApiProperty({
    description:
      'Nuevo estado del departamento (true para activo, false para inactivo)',
    example: false,
  })
  @IsDefined({ message: i18nValidationMessage('validation.isDefined') })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as boolean;
  })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  status!: boolean;
}
