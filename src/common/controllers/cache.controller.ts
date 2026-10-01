import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { AppCacheService } from '../services/app-cache.service';
import { ClearCacheDto } from '../dto/clear-cache.dto';

@ApiTags('Caché y Rendimiento')
@ApiBearerAuth()
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: AppCacheService) {}

  @Get('stats')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Consultar métricas operativas de la capa de caché reactiva',
    description:
      'Retorna información de aciertos (hits), fallos (misses), ratio de efectividad y estado de la conexión a Redis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStats() {
    return this.cacheService.getStats();
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Purgar selectiva o totalmente el almacenamiento en caché',
    description:
      'Permite limpiar por prefijo/patrón (ej. "dashboard:*") o purga completa si no se especifica patrón.',
  })
  @ApiResponse({
    status: 200,
    description: 'Caché invalidada exitosamente',
  })
  async clearCache(@Body() clearCacheDto?: ClearCacheDto) {
    if (clearCacheDto?.pattern) {
      const affected = await this.cacheService.delByPattern(
        clearCacheDto.pattern,
      );
      return {
        success: true,
        message: `Se purgaron las entradas coincidentes con el patrón "${clearCacheDto.pattern}"`,
        affected,
      };
    }

    await this.cacheService.clearAll();
    return {
      success: true,
      message: 'Toda la memoria caché ha sido purgada con éxito.',
    };
  }
}
