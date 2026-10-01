import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

import { RequestContext } from 'src/common/context/request-context';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          const cookies = request?.cookies as
            | Record<string, string>
            | undefined;
          return cookies?.token || null;
        },
      ]),
    });
  }

  async validate(payload: JwtPayload): Promise<Partial<User>> {
    const { id } = payload;
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.tokendNotValid'),
      );
    }
    if (!user.status) {
      throw new UnauthorizedException(this.i18n.t('errors.auth.userNotActive'));
    }

    RequestContext.setUser(user.id, user.email);

    const { password: _, ...rest } = user;

    return {
      ...rest,
    };
  }
}
