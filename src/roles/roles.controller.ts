import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRole } from '../auth/interfaces/valid-roles';
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

@ApiTags('Roles')
@ApiCookieAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Crear un nuevo rol en el sistema' })
  @ApiCreatedResponse({ description: 'El rol ha sido creado exitosamente.' })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Exclusivo para usuarios con rol superAdmin.',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener la lista de todos los roles' })
  @ApiOkResponse({
    description: 'Retorna la lista de roles disponibles en el sistema.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Obtener un rol específico por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol a buscar',
    type: 'string',
  })
  @ApiOkResponse({ description: 'Retorna los datos del rol encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }
}
