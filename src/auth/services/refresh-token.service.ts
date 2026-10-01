import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { RedisService } from 'src/common/services/redis.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { RefreshTokenPayload } from '../interfaces/refresh-token-payload.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const REFRESH_TOKEN_TTL = 7 * 24 * 3600; // 7 días en segundos
export const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutos en segundos

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  private getAccessSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') || 'defaultAccessSecret'
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'defaultRefreshSecret'
    );
  }

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const accessPayload: JwtPayload = {
      id: user.id,
      idRole: user.role?.id,
      idDepartment: user.staff?.department?.id,
    };

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.getAccessSecret(),
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: REFRESH_TOKEN_TTL,
    });

    // Registrar en Redis para trazabilidad y rotación
    await this.redisService.set(
      `refresh_token:${user.id}:${jti}`,
      'active',
      REFRESH_TOKEN_TTL,
    );
    await this.redisService.sadd(`user_tokens:${user.id}`, jti);
    await this.redisService.expire(`user_tokens:${user.id}`, REFRESH_TOKEN_TTL);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
    };
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: Partial<User>;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.missingRefreshToken') ||
          'Token de actualización no proporcionado.',
      );
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        rawRefreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.invalidRefreshToken') ||
          'Token de actualización inválido o expirado.',
      );
    }

    const { sub: userId, jti } = payload;

    // Verificar en Redis si el token está activo
    const storedStatus = await this.redisService.get(
      `refresh_token:${userId}:${jti}`,
    );

    if (!storedStatus) {
      // DETECCIÓN DE REUSO DE TOKEN (Token Reuse Attack RFC 6819)
      // Si el token es criptográficamente válido pero ya no existe en Redis, fue consumido previamente o revocado
      this.logger.warn(
        `[SEGURIDAD] Intento de reutilización de refresh token detectado para el usuario ${userId} (jti: ${jti}). Revocando todas las sesiones.`,
      );
      await this.revokeAllUserTokens(userId);

      throw new UnauthorizedException(
        this.i18n.t('errors.auth.refreshTokenReused') ||
          'Alerta de seguridad: Token de actualización ya utilizado o revocado. Por su seguridad, todas las sesiones activas han sido cerradas.',
      );
    }

    // Invalidar inmediatamente el token consumido (Rotación de un solo uso)
    await this.redisService.del(`refresh_token:${userId}:${jti}`);
    await this.redisService.srem(`user_tokens:${userId}`, jti);

    // Obtener datos frescos del usuario
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.tokendNotValid') || 'Usuario no encontrado.',
      );
    }

    if (!user.status) {
      throw new UnauthorizedException(
        this.i18n.t('errors.auth.userNotActive') || 'Usuario inactivo.',
      );
    }

    // Generar nuevo par rotado
    const newTokens = await this.generateTokens(user);

    const { password: _, ...userData } = user;

    return {
      ...newTokens,
      user: userData,
    };
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    try {
      const payload: unknown = this.jwtService.decode(rawRefreshToken);
      if (
        payload &&
        typeof payload === 'object' &&
        'sub' in payload &&
        'jti' in payload
      ) {
        const record = payload as Record<string, unknown>;
        const userId = String(record.sub);
        const jti = String(record.jti);
        await this.redisService.del(`refresh_token:${userId}:${jti}`);
        await this.redisService.srem(`user_tokens:${userId}`, jti);
        this.logger.debug(
          `Refresh token revocado exitosamente para usuario ${userId} (jti: ${jti})`,
        );
      }
    } catch (error) {
      this.logger.warn(`Error al revocar refresh token: ${error}`);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    if (!userId) return;

    try {
      const jtis = await this.redisService.smembers(`user_tokens:${userId}`);
      if (jtis && jtis.length > 0) {
        const keys = jtis.map((jti) => `refresh_token:${userId}:${jti}`);
        await this.redisService.del(...keys);
      }
      await this.redisService.del(`user_tokens:${userId}`);
      this.logger.log(
        `Todas las sesiones y tokens de actualización revocados para el usuario ${userId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Error al revocar todos los tokens del usuario ${userId}: ${error}`,
      );
    }
  }
}
