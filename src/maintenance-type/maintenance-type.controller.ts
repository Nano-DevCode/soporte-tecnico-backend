import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MaintenanceTypeService } from './maintenance-type.service';
import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';
import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Maintenance Type')
@ApiCookieAuth()
@UseFilters(DbexceptionFilter)
@Controller('maintenance-type')
export class MaintenanceTypeController {
  constructor(
    private readonly maintenanceTypeService: MaintenanceTypeService,
  ) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Crear un nuevo tipo de mantenimiento' })
  @ApiCreatedResponse({
    description: 'El tipo de mantenimiento fue creado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  create(@Body() createMaintenanceTypeDto: CreateMaintenanceTypeDto) {
    return this.maintenanceTypeService.create(createMaintenanceTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de mantenimiento' })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de mantenimiento registrados.',
  })
  findAll() {
    return this.maintenanceTypeService.findAll();
  }

  @Patch(':id')
  @Auth(ValidRole.superAdmin)
  @ApiParam({ name: 'id', description: 'ID del tipo de mantenimiento (UUID)' })
  @ApiOperation({ summary: 'Actualizar un tipo de mantenimiento existente' })
  @ApiOkResponse({
    description: 'El tipo de mantenimiento fue actualizado exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'ID inválido o datos incorrectos.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMaintenanceTypeDto: UpdateMaintenanceTypeDto,
  ) {
    return this.maintenanceTypeService.update(+id, updateMaintenanceTypeDto);
  }
}
