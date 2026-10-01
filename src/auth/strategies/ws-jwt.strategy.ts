import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<{
      handshake: {
        headers: {
          cookie?: string;
        };
      };
      data: Record<string, unknown>;
    }>();

    // 2. Leemos la cadena de texto crudo de las cookies
    const cookieHeader = client.handshake.headers.cookie;
    let token: string | undefined;

    // 3. Extraemos solo el valor de la cookie llamada token
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c) => c.trim());
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token)
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.tokendNotValid'),
      );

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findById(payload.id);
      if (!user)
        throw new UnauthorizedException(
          this.i18n.t('errors.auth.tokendNotValid'),
        );
      if (!user.status)
        throw new UnauthorizedException(
          this.i18n.t('errors.auth.userNotActive'),
        );

      const { password: _, ...rest } = user;
      client.data['user'] = rest;

      return true;
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.tokendNotValid'),
      );
    }
  }
}
