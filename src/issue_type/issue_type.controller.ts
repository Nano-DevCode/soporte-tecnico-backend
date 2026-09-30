import { Controller, Get, Post, Body, UseFilters } from '@nestjs/common';
import { IssueTypeService } from './issue_type.service';
import { CreateIssueTypeDto } from './dto/create-issue_type.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
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

@UseFilters(DbexceptionFilter)
@ApiTags('Issue Type')
@ApiCookieAuth()
@Controller('issue-type')
export class IssueTypeController {
  constructor(private readonly issueTypeService: IssueTypeService) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Crear un nuevo tipo de incidencia' })
  @ApiCreatedResponse({
    description: 'El tipo de incidencia ha sido creado exitosamente.',
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
  create(@Body() createIssueTypeDto: CreateIssueTypeDto) {
    return this.issueTypeService.create(createIssueTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de incidencia' })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de incidencia registrados.',
  })
  findAll() {
    return this.issueTypeService.findAll();
  }
}
