const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'cookies',
  'hash',
  'signature',
]);

/**
 * Sanitiza recursivamente un objeto o entidad antes de persistir en auditoría,
 * omitiendo campos sensibles, funciones y simplificando relaciones circulares.
 */
export function sanitizeAuditData(
  data: unknown,
  seen = new WeakSet<object>(),
): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  if (seen.has(data)) {
    const record = data as Record<string, unknown>;
    return record.id ? { id: record.id } : { ref: '[Circular]' };
  }

  seen.add(data);

  const sanitized: Record<string, unknown> = {};
  const record = data as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    // 1. Omitir campos sensibles
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // 2. Omitir funciones
    if (typeof value === 'function') {
      continue;
    }

    // 3. Manejo de fechas
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
      continue;
    }

    // 4. Manejo de arreglos
    if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === 'object' && item !== null
          ? sanitizeAuditData(item, seen)
          : item,
      );
      continue;
    }

    // 5. Manejo de relaciones u objetos anidados
    if (typeof value === 'object' && value !== null) {
      const childObj = value as Record<string, unknown>;
      if ('id' in childObj && Object.keys(childObj).length > 3) {
        sanitized[key] = { id: childObj.id };
      } else {
        sanitized[key] = sanitizeAuditData(childObj, seen);
      }
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
