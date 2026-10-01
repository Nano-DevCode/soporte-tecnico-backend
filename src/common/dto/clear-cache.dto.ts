import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClearCacheDto {
  @ApiPropertyOptional({
    description:
      'Patrón de claves a purgar (ej. "dashboard:*", "catalog:departments:*"). Si se omite, purga todo.',
    example: 'dashboard:*',
  })
  @IsOptional()
  @IsString()
  pattern?: string;
}
