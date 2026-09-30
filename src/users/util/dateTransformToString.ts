export function formatDatePretty(
  date?: Date | null,
  withSeconds: boolean = false,
): string {
  if (!date || isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  const formatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return `${day}/${month}/${year} ${hour}:${minute}${withSeconds ? `:${second}` : ''}`;
}
