import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppCacheService } from '../services/app-cache.service';

@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(private readonly cacheService: AppCacheService) {}

  @OnEvent('ticket.*', { async: true })
  async handleTicketEvents(): Promise<void> {
    try {
      this.logger.debug(
        `Evento de ticket detectado, purgando caché de métricas y dashboard...`,
      );
      await Promise.all([
        this.cacheService.delByPattern('dashboard:*'),
        this.cacheService.delByPattern('sla:*'),
      ]);
    } catch (error) {
      this.logger.error(
        `Error al invalidar caché para evento de ticket:`,
        error,
      );
    }
  }

  @OnEvent('department.*', { async: true })
  async handleDepartmentEvents(): Promise<void> {
    try {
      this.logger.debug(
        `Evento de departamento detectado, purgando catálogos y dashboard...`,
      );
      await Promise.all([
        this.cacheService.delByPattern('catalog:departments:*'),
        this.cacheService.delByPattern('dashboard:*'),
      ]);
    } catch (error) {
      this.logger.error(
        `Error al invalidar caché para evento de departamento:`,
        error,
      );
    }
  }

  @OnEvent('issue_type.*', { async: true })
  async handleIssueTypeEvents(): Promise<void> {
    try {
      this.logger.debug(
        `Evento de tipo de incidencia detectado, purgando catálogos y dashboard...`,
      );
      await Promise.all([
        this.cacheService.delByPattern('catalog:issue_types:*'),
        this.cacheService.delByPattern('dashboard:*'),
      ]);
    } catch (error) {
      this.logger.error(
        `Error al invalidar caché para evento de tipo de incidencia:`,
        error,
      );
    }
  }

  @OnEvent('sla.*', { async: true })
  async handleSlaEvents(): Promise<void> {
    try {
      this.logger.debug(
        `Evento de SLA detectado, purgando dashboard y reportes de SLA...`,
      );
      await Promise.all([
        this.cacheService.delByPattern('dashboard:*'),
        this.cacheService.delByPattern('sla:*'),
      ]);
    } catch (error) {
      this.logger.error(`Error al invalidar caché para evento de SLA:`, error);
    }
  }
}
