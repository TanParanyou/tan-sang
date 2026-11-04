/**
 * Centralized formatting utility for date and time displays.
 * Single source of truth across Web UI, printable receipts, slips,
 * LINE messages, and clipboard export texts.
 *
 * Ensures all dates and times are strictly formatted in Thailand timezone (Asia/Bangkok / UTC+7)
 * regardless of whether code runs on Vercel/server (UTC) or client devices abroad.
 */

export const THAI_TIMEZONE = 'Asia/Bangkok';

export interface FormatDateTimeOptions {
  /** Include ' น.' suffix after time (default: true) */
  includeTimeSuffix?: boolean;
  /** Add 'เวลา ' prefix before time (default: true) */
  includeTimePrefix?: boolean;
  /** Target timezone for formatting (default: 'Asia/Bangkok') */
  timeZone?: string;
}

/**
 * Safely parses various date inputs into a valid Date object.
 * If the input string has date and time but lacks timezone indicator (Z or +/-offset),
 * it assumes Thailand time (+07:00).
 */
export function parseDateInput(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // If string has date and time but lacks timezone indicator, assume +07:00
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(trimmed)) {
      const d = new Date(trimmed.replace(' ', 'T') + '+07:00');
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a date string or Date object into Thai date and time string in Thailand timezone (Asia/Bangkok).
 * Example output: "28 ต.ค. 2569 เวลา 11:36 น."
 */
export function formatThaiDateTime(
  dateInput: string | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  if (!dateInput) return '-';
  const {
    includeTimeSuffix = true,
    includeTimePrefix = true,
    timeZone = THAI_TIMEZONE,
  } = options;

  try {
    const d = parseDateInput(dateInput);
    if (!d) return String(dateInput);

    const datePart = d.toLocaleDateString('th-TH', {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const timePart = d.toLocaleTimeString('th-TH', {
      timeZone,
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
 * Formats date only in Thai Buddhist Era in Thailand timezone (e.g. "28 ต.ค. 2569").
 */
export function formatThaiDate(
  dateInput: string | Date | null | undefined,
  timeZone = THAI_TIMEZONE,
): string {
  if (!dateInput) return '-';
  try {
    const d = parseDateInput(dateInput);
    if (!d) return String(dateInput);

    return d.toLocaleDateString('th-TH', {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats time only in 24-hour format in Thailand timezone (e.g. "11:36 น.").
 */
export function formatThaiTime(
  dateInput: string | Date | null | undefined,
  includeSuffix = true,
  timeZone = THAI_TIMEZONE,
): string {
  if (!dateInput) return '-';
  try {
    const d = parseDateInput(dateInput);
    if (!d) return String(dateInput);

    const time = d.toLocaleTimeString('th-TH', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return includeSuffix ? `${time} น.` : time;
  } catch {
    return String(dateInput);
  }
}
