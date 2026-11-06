'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

export function HarnFeatureCard() {
  const { t } = useI18n();

  return (
    <section aria-label={t.landing.harnCardTitle}>
      <div className="rounded-theme border border-hairline bg-surface p-4 shadow-xs transition hover:border-chili/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-theme bg-chili/10 text-chili">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">{t.landing.harnCardTitle}</h2>
                <span className="rounded-full bg-chili/10 px-2 py-0.5 text-[10px] font-bold text-chili">
                  {t.common.newBadge}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-secondary">
                {t.landing.harnCardDesc}
              </p>
            </div>
          </div>
          <Link
            href="/harn"
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-theme bg-chili px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-chili/90 transition"
          >
            <span>{t.common.openApp}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
