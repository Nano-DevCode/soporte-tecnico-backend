import { Controller, Get, UseFilters } from '@nestjs/common';
import { CatalogSeedService } from './catalog-seed.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Catalog Seed')
@UseFilters(DbexceptionFilter)
@Controller('catalog-seed')
export class CatalogSeedController {
  constructor(private readonly catalogSeedService: CatalogSeedService) {}

  @Get()
  @ApiOperation({
    summary: 'Ejecutar el Seed general de catálogos para tickets',
    description:
      'ADVERTENCIA: Este endpoint elimina los registros existentes y vuelve a poblar los catálogos de tipos de incidentes, estados, documentos, tipos de mantenimiento y servicios con datos por defecto.',
  })
  @ApiResponse({
    status: 200,
    description: 'El seed se ejecutó correctamente.',
    type: String,
  })
  @ApiResponse({
    status: 500,
    description:
      'Error interno al intentar ejecutar el seed en la base de datos.',
  })
  runSeed() {
    return this.catalogSeedService.runSeed();
  }

  @Get('fault-validities')
  @ApiOperation({
    summary: 'Ejecutar el Seed de validez de fallas',
    description:
      'ADVERTENCIA: Este endpoint elimina los registros existentes y vuelve a poblar el catálogo de validez de fallas (fault validities) con datos por defecto.',
  })
  @ApiResponse({
    status: 200,
    description: 'El seed de validez de fallas se ejecutó correctamente.',
    type: String,
  })
  @ApiResponse({
    status: 500,
    description:
      'Error interno al intentar ejecutar el seed en la base de datos.',
  })
  runSeedFaultValidities() {
    return this.catalogSeedService.runSeedFaultValidities();
  }
}
