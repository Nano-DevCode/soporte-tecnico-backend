import { DataSource, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { AuditSubscriber } from './audit.subscriber';
import { AuditAction, AuditLog } from '../entities/audit-log.entity';
import { RequestContext } from 'src/common/context/request-context';

describe('AuditSubscriber', () => {
  let subscriber: AuditSubscriber;
  let mockDataSource: { subscribers: unknown[] };
  let mockAuditRepo: Record<string, jest.Mock>;
  let mockManager: Record<string, jest.Mock>;

  beforeEach(() => {
    mockAuditRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((log) => Promise.resolve({ id: 'saved-log-id', ...log })),
    };

    mockManager = {
      getRepository: jest.fn((entity) => {
        if (entity === AuditLog) return mockAuditRepo;
        return null;
      }),
    };

    mockDataSource = {
      subscribers: [],
    };

    subscriber = new AuditSubscriber(mockDataSource as unknown as DataSource);
  });

  it('should register itself into dataSource subscribers', () => {
    expect(mockDataSource.subscribers).toContain(subscriber);
  });

  describe('afterInsert', () => {
    it('should ignore AuditLog entity inserts', async () => {
      const event = {
        metadata: { name: 'AuditLog' },
        entity: { id: 'audit-1' },
        manager: mockManager,
      } as unknown as InsertEvent<Record<string, unknown>>;

      await subscriber.afterInsert(event);
      expect(mockAuditRepo.create).not.toHaveBeenCalled();
    });

    it('should create audit log for inserted business entity', async () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue({
        requestId: 'req-123',
        userId: 'user-uuid',
        userEmail: 'admin@system.com',
        ip: '127.0.0.1',
        userAgent: 'Jest/1.0',
      });

      const event = {
        metadata: { name: 'Ticket' },
        entity: { id: 't-1', title: 'Network Issue', password: 'secret' },
        manager: mockManager,
      } as unknown as InsertEvent<Record<string, unknown>>;

      await subscriber.afterInsert(event);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Ticket',
          entityId: 't-1',
          action: AuditAction.CREATE,
          performedBy: 'user-uuid',
          performedByEmail: 'admin@system.com',
          requestId: 'req-123',
          newValues: expect.objectContaining({
            id: 't-1',
            title: 'Network Issue',
            password: '[REDACTED]',
          }),
        }),
      );
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });
  });

  describe('afterUpdate', () => {
    it('should record diff when fields change', async () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue({
        requestId: 'req-456',
        userId: 'editor-uuid',
      });

      const event = {
        metadata: { name: 'Department' },
        databaseEntity: { id: 'dept-1', name: 'Old Dept', status: true },
        entity: { id: 'dept-1', name: 'New Dept', status: true },
        manager: mockManager,
      } as unknown as UpdateEvent<Record<string, unknown>>;

      await subscriber.afterUpdate(event);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Department',
          entityId: 'dept-1',
          action: AuditAction.UPDATE,
          performedBy: 'editor-uuid',
          changedFields: ['name'],
          previousValues: { name: 'Old Dept' },
          newValues: { name: 'New Dept' },
        }),
      );
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('should skip audit log if no fields changed', async () => {
      const event = {
        metadata: { name: 'Department' },
        databaseEntity: { id: 'dept-1', name: 'Same Dept' },
        entity: { id: 'dept-1', name: 'Same Dept' },
        manager: mockManager,
      } as unknown as UpdateEvent<Record<string, unknown>>;

      await subscriber.afterUpdate(event);
      expect(mockAuditRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('beforeRemove', () => {
    it('should record deletion with previousValues', async () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue({
        userId: 'admin-uuid',
      });

      const event = {
        metadata: { name: 'Ticket' },
        entity: { id: 't-99', folio: 'FOL-001' },
        manager: mockManager,
      } as unknown as RemoveEvent<Record<string, unknown>>;

      await subscriber.beforeRemove(event);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Ticket',
          entityId: 't-99',
          action: AuditAction.DELETE,
          performedBy: 'admin-uuid',
          previousValues: { id: 't-99', folio: 'FOL-001' },
          newValues: null,
        }),
      );
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });
  });
});
