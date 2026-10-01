import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/services/users.service';
import { LoginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtModule: JwtService,
    private readonly i18n: I18nService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.usersService.findByEmail(email);

    const fakeHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
    const userPassword = user ? user.password : fakeHash;

    const isPasswordValid = await bcrypt.compare(password, userPassword);
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.invalidCredentials'),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pd, ...rest } = user;

    const tokens = await this.refreshTokenService.generateTokens(user);

    return {
      ...rest,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({
        id: user.id,
        idRole: user.role.id,
        idDepartment: user.staff.department.id,
      }),
    };
  }

  async refreshTokens(refreshToken: string) {
    const result =
      await this.refreshTokenService.rotateRefreshToken(refreshToken);
    return {
      ...result,
      token: result.accessToken,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }
    return {
      message:
        this.i18n.t('events.auth.logout') || 'Sesión cerrada exitosamente.',
    };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    return {
      message: 'Todas las sesiones activas han sido revocadas exitosamente.',
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtModule.sign(payload);
    return token;
  }
}
