import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '../entities/user.entity';
import { RecuperatePasswordUserDto } from '../dto/account/recuperate-password-user.dto';
import { ChangePasswordUserDto } from '../dto/account/change-password-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ChangeUserStatusDto } from '../dto/account/change-status.dto';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiCookieAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Obtener lista paginada y filtrada de usuarios' })
  @ApiOkResponse({
    description: 'Retorna la lista de usuarios según los filtros aplicados.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requiere rol de superAdmin, coordinador o jefecc.',
  })
  findAll(@Query() filterDto: FilterUserDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get('profile')
  @Auth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Retorna los datos del usuario actual.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  profile(@GetUser() user: User) {
    return this.usersService.profile(user);
  }

  @Get('me/preferences')
  @Auth()
  @ApiOperation({
    summary:
      'Obtener preferencias de notificaciones granulares del usuario autenticado',
  })
  @ApiOkResponse({
    description: 'Retorna el objeto de preferencias de notificaciones.',
  })
  getPreferences(@GetUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar preferencias de notificaciones granulares',
  })
  @ApiOkResponse({ description: 'Preferencias actualizadas correctamente.' })
  updatePreferences(
    @GetUser() user: User,
    @Body() updatePreferencesDto: Record<string, boolean>,
  ) {
    return this.usersService.updatePreferences(user.id, updatePreferencesDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.visitor,
  )
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a buscar',
    type: 'string',
  })
  @ApiOkResponse({ description: 'Retorna los datos del usuario encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Auth(ValidRole.superAdmin, ValidRole.coordinador, ValidRole.jefecc)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Se requiere rol de superAdmin, coordinador o jefecc.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('recuperate-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña vía correo' })
  @ApiOkResponse({
    description:
      'Instrucciones enviadas al correo si el usuario está registrado.',
  })
  recuperatePassword(
    @Body() recuperatePasswordUserDto: RecuperatePasswordUserDto,
  ) {
    return this.usersService.recuperatePassword(recuperatePasswordUserDto);
  }

  @Patch('change-password')
  @Auth()
  @ApiOperation({
    summary: 'Cambiar la contraseña del usuario actualmente autenticado',
  })
  @ApiOkResponse({
    description: 'La contraseña ha sido actualizada exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  passwordChange(
    @Body() changePasswordUser: ChangePasswordUserDto,
    @GetUser() user: User,
  ) {
    return this.usersService.passwordChange(changePasswordUser, user);
  }

  @Patch('change-status/:id')
  @Auth(ValidRole.superAdmin, ValidRole.coordinador, ValidRole.jefecc)
  @ApiOperation({ summary: 'Activar o desactivar la cuenta de un usuario' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado del usuario ha sido modificado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeUserStatusDto,
  ) {
    return this.usersService.changeStatus(id, changeStatusDto);
  }

  @Patch(':id')
  @Auth(ValidRole.superAdmin, ValidRole.coordinador, ValidRole.jefecc)
  @ApiOperation({ summary: 'Actualizar la información de un usuario' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El usuario ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Eliminar un usuario del sistema' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a eliminar',
    type: 'string',
  })
  @ApiOkResponse({ description: 'El usuario ha sido eliminado exitosamente.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Solo el superAdmin puede eliminar usuarios.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
