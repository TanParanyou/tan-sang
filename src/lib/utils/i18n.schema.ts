import { z } from 'zod';

export const SupportedLocaleSchema = z.enum(['th', 'en']);
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;

export const LocalizedNameSchema = z.object({
  th: z.string().trim().min(1, 'กรุณาระบุชื่อภาษาไทย'),
  en: z.string().trim().optional(),
});

export type LocalizedName = z.infer<typeof LocalizedNameSchema>;

/**
 * Safely resolves localized text with automatic fallback to Thai (`th`).
 */
export function getLocalizedText(
  localized: LocalizedName,
  locale: SupportedLocale = 'th',
): string {
  if (locale === 'en' && localized.en && localized.en.trim().length > 0) {
    return localized.en.trim();
  }
  return localized.th.trim();
}
