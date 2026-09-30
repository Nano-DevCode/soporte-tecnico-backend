import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterSchoolPeriodDto extends PaginationWithPageDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo del periodo escolar',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}
