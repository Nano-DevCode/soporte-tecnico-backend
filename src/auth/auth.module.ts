import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { CommonModule } from 'src/common/common.module';
import { RefreshTokenService } from './services/refresh-token.service';
import { WsUserRoleGuard } from './guards/ws-user-role.guard';
import { WsJwtGuard } from './strategies/ws-jwt.strategy';
import { RolesModule } from './roles/roles.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WsJwtGuard,
    WsUserRoleGuard,
    RefreshTokenService,
  ],
  imports: [
    forwardRef(() => UsersModule),
    RolesModule,
    ConfigModule,
    CommonModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');
        return {
          secret: secret,
          signOptions: {
            expiresIn: (expiresIn as number | StringValue) || '2h',
          },
        };
      },
    }),
  ],
  exports: [
    RolesModule,
    JwtStrategy,
    PassportModule,
    JwtModule,
    WsJwtGuard,
    WsUserRoleGuard,
    RefreshTokenService,
  ],
})
export class AuthModule {}
