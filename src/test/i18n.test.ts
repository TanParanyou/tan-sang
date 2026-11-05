import { describe, expect, it } from 'vitest';
import { th } from '@/messages/th';
import { en } from '@/messages/en';
import { getLocalizedText } from '@/lib/utils/i18n.schema';

describe('i18n Translation & Localization Tests', () => {
  it('enforces identical key structure between TH and EN dictionaries', () => {
    function getDeepKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return getDeepKeys(val as Record<string, unknown>, fullKey);
        }
        return [fullKey];
      });
    }

    const thKeys = getDeepKeys(th as Record<string, unknown>).sort();
    const enKeys = getDeepKeys(en as Record<string, unknown>).sort();

    expect(enKeys).toEqual(thKeys);
  });

  it('correctly resolves localized text with fallback to Thai', () => {
    const itemWithBoth = {
      th: 'ข้าวกะเพราหมูสับ',
      en: 'Basil Minced Pork Rice',
    };

    expect(getLocalizedText(itemWithBoth, 'th')).toBe('ข้าวกะเพราหมูสับ');
    expect(getLocalizedText(itemWithBoth, 'en')).toBe('Basil Minced Pork Rice');

    const itemWithoutEn = {
      th: 'ข้าวหมูกรอบพริกเกลือ',
    };

    // When English is missing, fallback to Thai
    expect(getLocalizedText(itemWithoutEn, 'en')).toBe('ข้าวหมูกรอบพริกเกลือ');
    expect(getLocalizedText(itemWithoutEn, 'th')).toBe('ข้าวหมูกรอบพริกเกลือ');
  });

  it('handles empty or whitespace-only English text by falling back to Thai', () => {
    const itemWithWhitespaceEn = {
      th: 'ต้มยำกุ้ง',
      en: '   ',
    };

    expect(getLocalizedText(itemWithWhitespaceEn, 'en')).toBe('ต้มยำกุ้ง');
  });
});
