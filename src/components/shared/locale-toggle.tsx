'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils/cn';

export interface LocaleToggleProps {
  className?: string;
}

export function LocaleToggle({ className }: LocaleToggleProps) {
  const { locale, setLocale, isMounted, t } = useI18n();

  if (!isMounted) {
    return (
      <div
        className={cn(
          'inline-flex min-h-[38px] h-[38px] items-center rounded-theme border border-hairline bg-surface p-1 shadow-2xs opacity-60',
          className,
        )}
      >
        <span className="px-2 text-xs font-semibold text-ink">TH</span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t.common.switchLanguage}
      className={cn(
        'inline-flex min-h-[38px] h-[38px] items-center rounded-theme border border-hairline bg-surface p-0.5 shadow-2xs select-none',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale('th')}
        aria-pressed={locale === 'th'}
        className={cn(
          'flex h-full min-w-[32px] items-center justify-center rounded-[calc(var(--radius-theme,12px)-4px)] px-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili',
          locale === 'th'
            ? 'bg-ink text-surface shadow-xs font-bold'
            : 'text-ink-secondary hover:text-ink hover:bg-subtle',
        )}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={cn(
          'flex h-full min-w-[32px] items-center justify-center rounded-[calc(var(--radius-theme,12px)-4px)] px-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili',
          locale === 'en'
            ? 'bg-ink text-surface shadow-xs font-bold'
            : 'text-ink-secondary hover:text-ink hover:bg-subtle',
        )}
      >
        EN
      </button>
    </div>
  );
}
