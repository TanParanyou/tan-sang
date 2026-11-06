'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WifiOff, RotateCw, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function OfflinePage() {
  const { t } = useI18n();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center bg-canvas">
      <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-6 shadow-theme sm:p-8">
        {/* Mascot / Icon */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <Image
            src="/logo.png"
            alt="Tan-Sang"
            width={80}
            height={80}
            className="animate-mascot-float object-contain"
            priority
          />
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-subtle border border-hairline text-ink-muted">
            <WifiOff className="h-4 w-4" />
          </div>
        </div>

        {/* Offline Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1 text-xs font-medium text-ink-secondary border border-hairline">
          <span className="h-2 w-2 rounded-full bg-chili animate-pulse" />
          {t.offline.statusBadge}
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          {t.offline.title}
        </h1>
        <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
          {t.offline.description}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-theme bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            <RotateCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? t.common.loading : t.offline.retry}</span>
          </button>

          <Link
            href="/"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-theme border border-hairline bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-subtle active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            <span>{t.offline.backHome}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
