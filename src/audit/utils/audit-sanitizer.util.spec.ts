import { sanitizeAuditData } from './audit-sanitizer.util';

describe('AuditSanitizerUtil', () => {
  it('should return null for non-object values', () => {
    expect(sanitizeAuditData(null)).toBeNull();
    expect(sanitizeAuditData(undefined)).toBeNull();
    expect(sanitizeAuditData('string')).toBeNull();
    expect(sanitizeAuditData(123)).toBeNull();
  });

  it('should redact sensitive fields regardless of case', () => {
    const raw = {
      id: 'uuid-1',
      name: 'John',
      password: 'supersecretpassword',
      accessToken: 'jwt.token.here',
      refreshToken: 'refresh.token.here',
      authorization: 'Bearer 123',
    };

    const sanitized = sanitizeAuditData(raw);

    expect(sanitized).toEqual({
      id: 'uuid-1',
      name: 'John',
      password: '[REDACTED]',
      accessToken: '[REDACTED]',
      refreshToken: '[REDACTED]',
      authorization: '[REDACTED]',
    });
  });

  it('should format Dates to ISO strings', () => {
    const now = new Date('2026-09-30T20:00:00.000Z');
    const raw = {
      createdAt: now,
    };

    const sanitized = sanitizeAuditData(raw);
    expect(sanitized?.createdAt).toBe('2026-09-30T20:00:00.000Z');
  });

  it('should sanitize arrays', () => {
    const raw = {
      items: [{ name: 'A', password: '123' }, 'simple-item'],
    };

    const sanitized = sanitizeAuditData(raw);
    expect(sanitized?.items).toEqual([
      { name: 'A', password: '[REDACTED]' },
      'simple-item',
    ]);
  });

  it('should handle circular references gracefully', () => {
    interface CircularEntity {
      id: string;
      name?: string;
      entityA?: CircularEntity;
      entityB?: CircularEntity;
    }
    const a: CircularEntity = { id: 'a-1', name: 'Entity A' };
    const b: CircularEntity = { id: 'b-1', entityA: a };
    a.entityB = b;

    const sanitized = sanitizeAuditData(a);
    expect(sanitized?.name).toBe('Entity A');
    expect(sanitized?.entityB).toBeDefined();
  });
});
