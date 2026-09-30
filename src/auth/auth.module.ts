import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { WsUserRoleGuard } from './guards/ws-user-role.guard';
import { WsJwtGuard } from './strategies/ws-jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WsJwtGuard, WsUserRoleGuard],
  imports: [
    UsersModule,
    ConfigModule,
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
    JwtStrategy,
    PassportModule,
    JwtModule,
    WsJwtGuard,
    WsUserRoleGuard,
  ],
})
export class AuthModule {}
