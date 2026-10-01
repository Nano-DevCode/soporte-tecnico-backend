import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { CoordinationsService } from '../services/coordinations.service';
import { CreateCoordinationDto } from '../dto/create-coordination.dto';
import { UpdateCoordinationDto } from '../dto/update-coordination.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Coordinations')
@ApiCookieAuth()
@Controller('coordinations')
export class CoordinationsController {
  constructor(private readonly coordinationsService: CoordinationsService) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Crear una nueva coordinación' })
  @ApiCreatedResponse({
    description: 'La coordinación ha sido creada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  create(@Body() createCoordinationDto: CreateCoordinationDto) {
    return this.coordinationsService.create(createCoordinationDto);
  }

  @Get()
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener la lista de todas las coordinaciones' })
  @ApiOkResponse({
    description: 'Retorna la lista de coordinaciones registradas.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll() {
    return this.coordinationsService.findAll();
  }

  @Get(':id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener una coordinación específica por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la coordinación a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos de la coordinación encontrada.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.coordinationsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Actualizar los datos de una coordinación existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la coordinación a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'La coordinación ha sido actualizada exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  update(
    @Param('id') id: string,
    @Body() updateCoordinationDto: UpdateCoordinationDto,
  ) {
    return this.coordinationsService.update(id, updateCoordinationDto);
  }
}

