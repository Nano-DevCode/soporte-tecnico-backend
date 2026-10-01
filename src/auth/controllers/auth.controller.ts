import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Auth } from '../decorators/auth.decorator';
import { I18nService } from 'nestjs-i18n';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ValidRole } from '../interfaces/valid-roles';

const isProduction = process.env.NODE_ENV === 'production';
const isCookieSecure =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isCookieSecure,
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
      'Autenticación exitosa. Retorna los datos del usuario y establece las cookies HttpOnly para token y refreshToken.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = await this.authService.login(loginUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token, accessToken, refreshToken, expiresIn, ...userData } =
      authResponse;

    res.cookie('token', token, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 5, // 5 horas
    });

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
      });
    }

    return userData;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rotar token de actualización y renovar credenciales',
    description:
      'Valida el refreshToken (desde cookie HttpOnly o cuerpo JSON), lo revoca y emite un nuevo par de tokens.',
  })
  @ApiOkResponse({
    description: 'Tokens renovados y rotados exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token no proporcionado, inválido o reutilizado.',
  })
  async refreshToken(
    @Req() req: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req?.cookies as Record<string, string> | undefined;
    const tokenToRefresh =
      refreshTokenDto?.refreshToken || cookies?.refreshToken;

    if (!tokenToRefresh) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.refreshTokenRequired') ||
          'Refresh token no proporcionado.',
      );
    }

    const tokens = await this.authService.refreshTokens(tokenToRefresh);

    res.cookie('token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 5,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      message: 'Tokens renovados exitosamente.',
      expiresIn: tokens.expiresIn,
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Cerrar sesión activa y revocar tokens',
    description:
      'Invalida el refreshToken en la base de datos y borra las cookies HttpOnly del cliente.',
  })
  @ApiOkResponse({ description: 'Sesión cerrada exitosamente.' })
  async logout(
    @Req() req: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req?.cookies as Record<string, string> | undefined;
    const tokenToRevoke =
      refreshTokenDto?.refreshToken || cookies?.refreshToken;

    await this.authService.logout(tokenToRevoke);

    res.clearCookie('token', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return {
      message:
        this.i18n.t('events.auth.logout') || 'Sesión cerrada exitosamente.',
    };
  }

  @Post('logout-all')
  @Auth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Revocar todas las sesiones del usuario en todos los dispositivos',
  })
  @ApiOkResponse({
    description: 'Todas las sesiones han sido revocadas exitosamente.',
  })
  async logoutAll(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(user.id);

    res.clearCookie('token', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return result;
  }

  @Get('private')
  @Auth(ValidRole.superAdmin)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Endpoint privado de prueba para superAdmin' })
  testPrivateRole(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('check-status')
  @Auth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Verificar el estado de autenticación del usuario' })
  @ApiOkResponse({
    description:
      'Retorna el estado de autenticación del usuario y un nuevo token.',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  checkAuthStatus(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = this.authService.checkAuthStatus(user);

    res.cookie('token', authResponse.token, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 5,
    });

    return authResponse;
  }

  @Patch('private')
  @Auth(ValidRole.superAdmin)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Endpoint privado de prueba (Patch) para superAdmin',
  })
  testPrivateRolePatch(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
