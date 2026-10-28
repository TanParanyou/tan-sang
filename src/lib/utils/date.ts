/**
 * Centralized formatting utility for date and time displays.
 * Single source of truth across Web UI, printable receipts, slips,
 * LINE messages, and clipboard export texts.
 */

export interface FormatDateTimeOptions {
  /** Include ' น.' suffix after time (default: true) */
  includeTimeSuffix?: boolean;
  /** Add 'เวลา ' prefix before time (default: true) */
  includeTimePrefix?: boolean;
}

/**
 * Formats a date string or Date object into Thai date and time string.
 * Example output: "28 ต.ค. 2569 เวลา 11:36 น."
 */
export function formatThaiDateTime(
  dateInput: string | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  if (!dateInput) return '-';
  const { includeTimeSuffix = true, includeTimePrefix = true } = options;

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const datePart = d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const timePart = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const prefix = includeTimePrefix ? ' เวลา ' : ' ';
    const suffix = includeTimeSuffix ? ' น.' : '';
    return `${datePart}${prefix}${timePart}${suffix}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date only in Thai Buddhist Era (e.g. "28 ต.ค. 2569").
 */
export function formatThaiDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats time only in 24-hour format (e.g. "11:36 น.").
 */
export function formatThaiTime(
  dateInput: string | Date | null | undefined,
  includeSuffix = true,
): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const time = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return includeSuffix ? `${time} น.` : time;
  } catch {
    return String(dateInput);
  }
}
