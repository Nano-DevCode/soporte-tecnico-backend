import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from './redis.service';

export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: string;
  inMemoryEntries: number;
  redisConnected: boolean;
}

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly memoryCache = new Map<string, MemoryCacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Genera una clave de caché determinista a partir de un prefijo y parámetros arbitrarios.
   */
  generateKey(prefix: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return prefix;
    }

    // Ordenar recursivamente las llaves para garantizar determinismo
    const sortedString = JSON.stringify(params, Object.keys(params).sort());
    const hash = createHash('md5')
      .update(sortedString)
      .digest('hex')
      .slice(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Patrón Cache-Aside: Consulta caché o ejecuta función proveedora y almacena resultado.
   */
  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Obtiene un valor deserializado de la caché (Redis o memoria fallback).
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Intentar Redis
    if (this.redisService.connected) {
      try {
        const raw = await this.redisService.get(key);
        if (raw !== null) {
          this.hits++;
          return JSON.parse(raw) as T;
        }
      } catch (error) {
        this.logger.warn(
          `Error deserializando clave ${key} desde Redis: ${error}`,
        );
      }
    }

    // 2. Fallback a caché en memoria
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiresAt) {
        this.hits++;
        return memEntry.value as T;
      }
      this.memoryCache.delete(key);
    }

    this.misses++;
    return null;
  }

  /**
   * Guarda un valor en Redis y en memoria local con tiempo de expiración en segundos.
   */
  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const safeTtl = Math.max(ttlSeconds, 1);

    // Guardar en Redis si está disponible
    if (this.redisService.connected) {
      try {
        await this.redisService.set(key, JSON.stringify(value), safeTtl);
      } catch (error) {
        this.logger.warn(`Error al guardar en Redis (${key}): ${error}`);
      }
    }

    // Siempre guardar en memoria local como fallback
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + safeTtl * 1000,
    });
  }

  /**
   * Elimina una clave de Redis y de la memoria local.
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.redisService.connected) {
      await this.redisService.del(key);
    }
  }

  /**
   * Invalida todas las claves que coincidan con un patrón comodín (ej: 'dashboard:*').
   */
  async delByPattern(pattern: string): Promise<number> {
    let deletedRedis = 0;
    if (this.redisService.connected) {
      deletedRedis = await this.redisService.delByPattern(pattern);
    }

    // Invalida en memoria local usando regex
    const regexPattern = new RegExp(
      '^' +
        pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
        '$',
    );

    let deletedMem = 0;
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
        deletedMem++;
      }
    }

    this.logger.debug(
      `Invalidado patrón ${pattern} (Redis: ${deletedRedis}, Memoria: ${deletedMem})`,
    );

    return Math.max(deletedRedis, deletedMem);
  }

  /**
   * Obtiene métricas y estadísticas de uso del caché.
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate =
      totalRequests === 0
        ? '0.00%'
        : `${((this.hits / totalRequests) * 100).toFixed(2)}%`;

    return {
      hits: this.hits,
      misses: this.misses,
      totalRequests,
      hitRate,
      inMemoryEntries: this.memoryCache.size,
      redisConnected: this.redisService.connected,
    };
  }

  /**
   * Limpia toda la caché almacenada y reinicia métricas.
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    if (this.redisService.connected) {
      await this.redisService.delByPattern('*');
    }
    this.hits = 0;
    this.misses = 0;
    this.logger.log('Caché purgada completamente.');
  }
}
