import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtModule: JwtService,
    private readonly i18n: I18nService,
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

    return {
      ...rest,
      token: this.getJwtToken({
        id: user.id,
        idRole: user.role.id,
        idDepartment: user.staff.department.id,
      }),
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

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtModule.sign(payload);
    return token;
  }
}
