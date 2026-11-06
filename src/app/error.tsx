'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-start justify-center px-6 py-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-chili">
        {t.errors.pageErrorBadge}
      </p>
      <h1 className="mt-2 text-xl font-semibold text-ink">{t.errors.pageErrorTitle}</h1>
      <p className="mt-2 text-sm text-ink-secondary">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili"
      >
        {t.errors.retryButton}
      </button>
    </main>
  );
}
