/**
 * VEILLE Time & Date Utilities
 * Parses UTC or arbitrary timestamps and accurately formats them in the operator's local timezone.
 */

export function parseToDate(input?: string | number | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = String(input).trim();
  if (!str) return null;

  // Remove trailing " UTC" or " (UTC)" if present
  str = str.replace(/\s*\(?UTC\)?$/i, '').trim();

  // If format is "YYYY-MM-DD HH:mm:ss" or with milliseconds, replace space with 'T'
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // If no timezone offset (+HH:MM, -HH:MM, or Z) is present, append 'Z' to treat as UTC (backend default)
  if (!str.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
    str += 'Z';
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats timestamp into "YYYY-MM-DD HH:mm:ss" (Operator's local browser timezone).
 */
export function formatLocalTimestamp(isoString?: string | number | Date | null): string {
  const date = parseToDate(isoString);
  if (!date) {
    return isoString ? String(isoString) : '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats timestamp into "HH:mm:ss" (Operator's local browser timezone).
 */
export function formatLocalTimeOnly(isoString?: string | number | Date | null): string {
  const date = parseToDate(isoString);
  if (!date) {
    return isoString ? String(isoString) : '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats timestamp into "YYYY-MM-DD"
 */
export function formatLocalDateOnly(isoString?: string | number | Date | null): string {
  const date = parseToDate(isoString);
  if (!date) {
    return isoString ? String(isoString) : '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
