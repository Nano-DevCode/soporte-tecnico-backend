import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, AuditLog } from '../entities/audit-log.entity';
import { RequestContext } from 'src/common/context/request-context';
import { sanitizeAuditData } from '../utils/audit-sanitizer.util';

const IGNORED_ENTITIES = new Set([
  'AuditLog',
  'audit_log',
  'FolioCounter',
  'folio_counter',
]);

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  private isIgnored(entityName: string): boolean {
    return IGNORED_ENTITIES.has(entityName);
  }

  private extractEntityId(candidate: unknown): string {
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate);
    }
    return 'unknown';
  }

  async afterInsert(
    event: InsertEvent<Record<string, unknown>>,
  ): Promise<void> {
    const entityName = event.metadata.name;
    const entity = event.entity
      ? (event.entity as Record<string, unknown>)
      : undefined;

    if (this.isIgnored(entityName) || !entity) {
      return;
    }

    try {
      const entityId = this.extractEntityId(entity.id ?? entity.uuid);
      const ctx = RequestContext.get();

      const newValues = sanitizeAuditData(entity);

      const auditLog = event.manager.getRepository(AuditLog).create({
        entityName,
        entityId,
        action: AuditAction.CREATE,
        performedBy: ctx?.userId || null,
        performedByEmail: ctx?.userEmail || null,
        ipAddress: ctx?.ip || null,
        userAgent: ctx?.userAgent || null,
        requestId: ctx?.requestId || null,
        previousValues: null,
        newValues,
        changedFields: newValues ? Object.keys(newValues) : [],
      });

      await event.manager.getRepository(AuditLog).save(auditLog);
    } catch (error) {
      this.logger.error(
        `Error al registrar auditoría de inserción para ${entityName}:`,
        error,
      );
    }
  }

  async afterUpdate(
    event: UpdateEvent<Record<string, unknown>>,
  ): Promise<void> {
    const entityName = event.metadata.name;
    const newEntity = event.entity
      ? (event.entity as Record<string, unknown>)
      : undefined;
    const oldEntity = event.databaseEntity
      ? (event.databaseEntity as Record<string, unknown>)
      : {};

    if (this.isIgnored(entityName) || !newEntity) {
      return;
    }

    try {
      const entityId = this.extractEntityId(
        newEntity.id ?? oldEntity.id ?? newEntity.uuid,
      );
      const ctx = RequestContext.get();

      const previousValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      const changedFields: string[] = [];

      for (const key of Object.keys(newEntity)) {
        if (key === 'updatedAt' || key === 'updated_at' || key === 'version') {
          continue;
        }

        const oldVal = oldEntity[key];
        const newVal = newEntity[key];

        // Comparar serializaciones para detectar cambios en objetos/fechas/primitivos
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedFields.push(key);
          previousValues[key] = oldVal;
          newValues[key] = newVal;
        }
      }

      if (changedFields.length === 0) {
        return;
      }

      const auditLog = event.manager.getRepository(AuditLog).create({
        entityName,
        entityId,
        action: AuditAction.UPDATE,
        performedBy: ctx?.userId || null,
        performedByEmail: ctx?.userEmail || null,
        ipAddress: ctx?.ip || null,
        userAgent: ctx?.userAgent || null,
        requestId: ctx?.requestId || null,
        previousValues: sanitizeAuditData(previousValues),
        newValues: sanitizeAuditData(newValues),
        changedFields,
      });

      await event.manager.getRepository(AuditLog).save(auditLog);
    } catch (error) {
      this.logger.error(
        `Error al registrar auditoría de actualización para ${entityName}:`,
        error,
      );
    }
  }

  async beforeRemove(
    event: RemoveEvent<Record<string, unknown>>,
  ): Promise<void> {
    const entityName = event.metadata.name;
    if (this.isIgnored(entityName)) {
      return;
    }

    try {
      const rawEntity: unknown = event.entity ?? event.databaseEntity;
      const entity =
        rawEntity && typeof rawEntity === 'object'
          ? (rawEntity as Record<string, unknown>)
          : undefined;

      const entityId = this.extractEntityId(
        event.entityId ?? entity?.id ?? entity?.uuid,
      );
      const ctx = RequestContext.get();

      const previousValues = entity ? sanitizeAuditData(entity) : null;

      const auditLog = event.manager.getRepository(AuditLog).create({
        entityName,
        entityId,
        action: AuditAction.DELETE,
        performedBy: ctx?.userId || null,
        performedByEmail: ctx?.userEmail || null,
        ipAddress: ctx?.ip || null,
        userAgent: ctx?.userAgent || null,
        requestId: ctx?.requestId || null,
        previousValues,
        newValues: null,
        changedFields: previousValues ? Object.keys(previousValues) : [],
      });

      await event.manager.getRepository(AuditLog).save(auditLog);
    } catch (error) {
      this.logger.error(
        `Error al registrar auditoría de eliminación para ${entityName}:`,
        error,
      );
    }
  }
}
