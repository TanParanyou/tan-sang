import { describe, expect, it } from 'vitest';
import { formatThaiDate, formatThaiDateTime, formatThaiTime } from '@/lib/utils/date';

describe('formatThaiDateTime utility', () => {
  it('formats ISO string to Thai date and time with prefix and suffix', () => {
    // 2026-10-28T04:36:00Z -> In UTC+7 is 11:36
    const d = new Date(2026, 9, 28, 11, 36, 0); // Month is 0-indexed, so 9 = October
    const result = formatThaiDateTime(d);
    expect(result).toContain('28 ต.ค. 2569');
    expect(result).toContain('เวลา');
    expect(result).toContain('11:36');
    expect(result).toContain('น.');
  });

  it('supports custom formatting options', () => {
    const d = new Date(2026, 9, 28, 11, 36, 0);
    const result = formatThaiDateTime(d, {
      includeTimePrefix: false,
      includeTimeSuffix: false,
    });
    expect(result).toBe('28 ต.ค. 2569 11:36');
  });

  it('handles null, undefined, and empty string safely', () => {
    expect(formatThaiDateTime(null)).toBe('-');
    expect(formatThaiDateTime(undefined)).toBe('-');
    expect(formatThaiDateTime('')).toBe('-');
  });
});

describe('formatThaiDate and formatThaiTime utilities', () => {
  it('formats Thai date only', () => {
    const d = new Date(2026, 9, 28, 11, 36, 0);
    expect(formatThaiDate(d)).toBe('28 ต.ค. 2569');
  });

  it('formats Thai time only', () => {
    const d = new Date(2026, 9, 28, 11, 36, 0);
    expect(formatThaiTime(d)).toBe('11:36 น.');
    expect(formatThaiTime(d, false)).toBe('11:36');
  });
});
