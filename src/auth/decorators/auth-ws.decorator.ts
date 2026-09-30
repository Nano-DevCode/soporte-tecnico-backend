// auth/decorators/auth-ws.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRole } from '../interfaces/valid-roles';
import { RoleProtected } from './role-protected.decorator';
import { WsUserRoleGuard } from '../guards/ws-user-role.guard';
import { WsJwtGuard } from '../strategies/ws-jwt.strategy';

export function AuthWs(...roles: ValidRole[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(WsJwtGuard, WsUserRoleGuard),
  );
}
