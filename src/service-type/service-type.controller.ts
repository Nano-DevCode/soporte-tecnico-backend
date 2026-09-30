import { Controller, Get, Post, Body, UseFilters } from '@nestjs/common';
import { ServiceTypeService } from './service-type.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
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
} from '@nestjs/swagger';

@UseFilters(DbexceptionFilter)
@ApiTags('Service Type')
@ApiCookieAuth()
@Controller('service-type')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Crear un nuevo tipo de servicio' })
  @ApiCreatedResponse({
    description: 'El tipo de servicio ha sido creado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  @ApiForbiddenResponse({
    description: 'No tiene los roles necesarios (superAdmin).',
  })
  create(@Body() createServiceTypeDto: CreateServiceTypeDto) {
    return this.serviceTypeService.create(createServiceTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de servicio' })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de servicio registrados.',
  })
  findAll() {
    return this.serviceTypeService.findAll();
  }
}
