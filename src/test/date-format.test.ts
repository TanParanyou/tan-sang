import { describe, expect, it } from 'vitest';
import {
  formatThaiDate,
  formatThaiDateTime,
  formatThaiTime,
  parseDateInput,
  THAI_TIMEZONE,
} from '@/lib/utils/date';

describe('formatThaiDateTime utility with Timezone enforcement (Asia/Bangkok)', () => {
  it('formats UTC ISO string correctly to Thai date and time in Asia/Bangkok (+07:00)', () => {
    // 2026-10-28T04:36:00Z in UTC -> 11:36 in Asia/Bangkok (UTC+7)
    const isoUtc = '2026-10-28T04:36:00.000Z';
    const result = formatThaiDateTime(isoUtc);
    expect(result).toContain('28 ต.ค. 2569');
    expect(result).toContain('เวลา');
    expect(result).toContain('11:36');
    expect(result).toContain('น.');
  });

  it('formats Date object created from UTC timestamp strictly in Asia/Bangkok', () => {
    const d = new Date('2026-10-28T04:36:00.000Z');
    const result = formatThaiDateTime(d);
    expect(result).toContain('28 ต.ค. 2569');
    expect(result).toContain('11:36');
    expect(result).toContain('น.');
  });

  it('formats date string without timezone indicator assuming Bangkok time (+07:00)', () => {
    const rawLocalString = '2026-10-28 11:36:00';
    const result = formatThaiDateTime(rawLocalString);
    expect(result).toContain('28 ต.ค. 2569');
    expect(result).toContain('11:36');
  });

  it('prevents date rollback across midnight boundary in UTC vs Bangkok', () => {
    // 2026-10-27T18:30:00Z is 01:30 AM on Oct 28 in Bangkok (+7h)
    const lateUtc = '2026-10-27T18:30:00.000Z';
    expect(formatThaiDate(lateUtc)).toBe('28 ต.ค. 2569');
    expect(formatThaiTime(lateUtc)).toBe('01:30 น.');
    expect(formatThaiDateTime(lateUtc)).toBe('28 ต.ค. 2569 เวลา 01:30 น.');
  });

  it('supports custom formatting options', () => {
    const isoUtc = '2026-10-28T04:36:00.000Z';
    const result = formatThaiDateTime(isoUtc, {
      includeTimePrefix: false,
      includeTimeSuffix: false,
    });
    expect(result).toBe('28 ต.ค. 2569 11:36');
  });

  it('handles null, undefined, and empty string safely', () => {
    expect(formatThaiDateTime(null)).toBe('-');
    expect(formatThaiDateTime(undefined)).toBe('-');
    expect(formatThaiDateTime('')).toBe('-');
    expect(formatThaiDate(null)).toBe('-');
    expect(formatThaiTime(null)).toBe('-');
  });
});

describe('formatThaiDate and formatThaiTime utilities', () => {
  const sampleUtc = '2026-10-28T04:36:00.000Z';

  it('formats Thai date only in Buddhist Era (BE)', () => {
    expect(formatThaiDate(sampleUtc)).toBe('28 ต.ค. 2569');
  });

  it('formats Thai time only with or without suffix in 24h format', () => {
    expect(formatThaiTime(sampleUtc)).toBe('11:36 น.');
    expect(formatThaiTime(sampleUtc, false)).toBe('11:36');
  });

  it('exports THAI_TIMEZONE as Asia/Bangkok', () => {
    expect(THAI_TIMEZONE).toBe('Asia/Bangkok');
  });

  it('parseDateInput parses safely', () => {
    expect(parseDateInput(null)).toBeNull();
    expect(parseDateInput('invalid')).toBeNull();
    expect(parseDateInput('2026-10-28T04:36:00Z')).toBeInstanceOf(Date);
  });
});
