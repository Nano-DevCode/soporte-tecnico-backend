import { Body, Controller, Get, Patch, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { GetUser } from './decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Auth } from './decorators/auth.decorator';
import { I18nService } from 'nestjs-i18n';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ValidRole } from './interfaces/valid-roles';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiCreatedResponse({
    description:
      'Autenticación exitosa. Retorna los datos del usuario y establece la cookie HttpOnly.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = await this.authService.login(loginUserDto);
    const { token, ...userData } = authResponse;

    res.cookie('token', token, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 5, // 5 horas
    });

    return userData;
  }

  @Get('check-auth-status')
  @Auth()
  @ApiOperation({
    summary: 'Verificar estado de autenticación y renovar sesión',
  })
  @ApiOkResponse({
    description:
      'Token válido. Retorna los datos del usuario y renueva la cookie.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token faltante, inválido o expirado.',
  })
  @ApiCookieAuth()
  checkAuthStatus(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = this.authService.checkAuthStatus(user);
    const { token, ...userData } = authResponse;

    // Al recargar la página, esto sobreescribirá la cookie correctamente porque las opciones coinciden
    res.cookie('token', token, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 4,
    });

    return userData;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiCreatedResponse({
    description: 'Sesión cerrada exitosamente y cookie eliminada.',
  })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', COOKIE_OPTIONS);
    return { message: this.i18n.t('events.auth.logout') };
  }

  @Patch('prueba')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({ summary: 'Endpoint de prueba protegido' })
  @ApiOkResponse({ description: 'Retorna los datos del usuario logueado.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiCookieAuth()
  prueba(@GetUser() user: User) {
    return user;
  }
}
