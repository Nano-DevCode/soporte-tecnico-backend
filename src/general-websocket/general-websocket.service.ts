import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Injectable()
export class GeneralWebsocketService {
  private readonly roleRooms: Record<ValidRole, string[]> = {
    [ValidRole.superAdmin]: ['admins_room', 'all_current_tickets'],
    [ValidRole.coordinador]: ['coordinators_room'],
    [ValidRole.inventory]: ['inventorys_room'],
    [ValidRole.jefe]: ['deptos_room'],
    [ValidRole.jefecc]: ['bosscc_room', 'all_current_tickets'],
    [ValidRole.planning]: ['planings_room'],
    [ValidRole.secretaria]: ['secretarys_room', 'all_current_tickets'],
    [ValidRole.tecnico]: ['technicians_room'],
    [ValidRole.visitor]: ['visitors_room', 'all_current_tickets'],
  };

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  private extractCookie(
    cookieString: string,
    cookieName: string,
  ): string | null {
    if (!cookieString) return null;
    const match = cookieString.match(
      new RegExp(`(^|;\\s*)(${cookieName})=([^;]*)`),
    );
    return match ? decodeURIComponent(match[3]) : null;
  }

  async authenticateClient(cookieString?: string) {
    if (!cookieString)
      throw new UnauthorizedException('No tienes autorización');

    const token = this.extractCookie(cookieString, 'token');
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    const payload: JwtPayload = this.jwtService.verify(token);
    const user = await this.userService.findById(payload.id);

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const roomToJoin = this.roleRooms[user.role.name as ValidRole];

    return {
      userId: payload.id,
      staffId: user.staff?.id,
      roomToJoin,
    };
  }
}
