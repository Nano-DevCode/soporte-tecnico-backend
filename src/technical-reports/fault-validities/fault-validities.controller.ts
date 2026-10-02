import { Controller, Post, Body, Get } from '@nestjs/common';
import { FaultValiditiesService } from './fault-validities.service';
import { CreateFaultValidityDto } from './dto/create-fault-validity.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Naturaleza del problema')
@ApiCookieAuth()
@Controller('fault-validities')
export class FaultValiditiesController {
  constructor(
    private readonly faultValiditiesService: FaultValiditiesService,
  ) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Crear una nueva opción de naturaleza del problema',
  })
  @ApiCreatedResponse({
    description: 'La naturaleza del problema ha sido creada exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token faltante o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No tiene el rol necesario para realizar esta acción.',
  })
  create(@Body() createFaultValidityDto: CreateFaultValidityDto) {
    return this.faultValiditiesService.create(createFaultValidityDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las opciones de naturalezas del problema',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de naturalezas del problema registradas.',
  })
  findAll() {
    return this.faultValiditiesService.findAll();
  }
}
