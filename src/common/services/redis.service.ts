import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host =
      this.configService.get<string>('DB_HOST_REDIS') ||
      this.configService.get<string>('redis_host') ||
      'localhost';
    const port =
      this.configService.get<number>('REDIS_PORT') ||
      this.configService.get<number>('redis_port') ||
      6379;
    const password =
      this.configService.get<string>('REDIS_PASSWORD') ||
      this.configService.get<string>('redis_password') ||
      undefined;

    try {
      this.client = new Redis({
        host,
        port: Number(port),
        password: password ? String(password) : undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) return null; // Detener reintentos agresivos si no está disponible
          return Math.min(times * 500, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Conexión establecida con Redis (${host}:${port})`);
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis no disponible temporalmente: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      // Intento de conexión no bloqueante
      this.client.connect().catch((err: unknown) => {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `No se pudo conectar a Redis al iniciar: ${msg}. Operando en modo degradado.`,
        );
      });
    } catch (error) {
      this.logger.error('Error al instanciar cliente de Redis', error);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  get connected(): boolean {
    return this.isConnected;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.warn(`Error al obtener clave de Redis (${key}): ${error}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Error al guardar en Redis (${key}): ${error}`);
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.client || !this.isConnected || keys.length === 0) return 0;
    try {
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(
        `Error al eliminar de Redis (${keys.join(', ')}): ${error}`,
      );
      return 0;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client || !this.isConnected || members.length === 0) return 0;
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      this.logger.warn(
        `Error al agregar a conjunto en Redis (${key}): ${error}`,
      );
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.warn(`Error al leer conjunto de Redis (${key}): ${error}`);
      return [];
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client || !this.isConnected || members.length === 0) return 0;
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      this.logger.warn(
        `Error al remover de conjunto en Redis (${key}): ${error}`,
      );
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const res = await this.client.expire(key, ttlSeconds);
      return res === 1;
    } catch (error) {
      this.logger.warn(
        `Error al establecer expiración en Redis (${key}): ${error}`,
      );
      return false;
    }
  }
}
