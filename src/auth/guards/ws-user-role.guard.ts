import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/users/entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class WsUserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles || validRoles.length === 0) return true;

    const client = context.switchToWs().getClient<{
      data: Record<string, unknown>;
    }>();

    const user = client.data['user'] as Partial<User>;

    if (!user) throw new BadRequestException('User not found');
    if (validRoles.includes(user.role?.name ?? '')) return true;

    throw new ForbiddenException(`User ${user.staff?.name} needs a valid role`);
  }
}
