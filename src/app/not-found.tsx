'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-start justify-center px-6 py-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-chili">404</p>
      <h1 className="mt-1 text-xl font-semibold text-ink">{t.errors.notFoundTitle}</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        {t.errors.notFoundDesc}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        {t.errors.backHome}
      </Link>
    </main>
  );
}
