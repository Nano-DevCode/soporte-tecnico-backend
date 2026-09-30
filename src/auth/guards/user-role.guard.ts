import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/users/entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );
    if (!validRoles) return true;
    if (validRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user: User }>();
    const user = req.user as Partial<User>;

    if (!user)
      throw new BadRequestException(this.i18n.t('errors.auth.userNotFound'));

    if (validRoles.includes(user.role?.name ?? '')) return true;

    throw new ForbiddenException(`User need a valid role`);
  }
}
