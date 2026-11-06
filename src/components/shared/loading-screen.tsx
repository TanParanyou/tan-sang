'use client';

import React from 'react';
import { Loader2, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message,
  className,
  fullScreen = false,
}: LoadingScreenProps) {
  const { t } = useI18n();
  const displayMessage = message ?? t.common.loadingData;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center animate-fade-in',
        fullScreen ? 'min-h-[70vh]' : 'py-16',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-subtle border border-hairline shadow-xs animate-mascot-float">
          <img
            src="/brand-mascot.png"
            alt={t.common.brandName}
            className="h-10 w-10 object-contain animate-mascot-breathe drop-shadow-xs"
          />
          <div className="absolute -inset-1.5 rounded-full border border-chili/25 animate-soft-pulse pointer-events-none" />
        </div>
        <div className="mt-2.5 h-1.5 w-10 rounded-full bg-ink/10 blur-[1px] animate-soft-pulse" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{displayMessage}</p>
        <p className="text-xs text-ink-muted">{t.common.loadingHint}</p>
      </div>
    </div>
  );
}

export function LoadingCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-hairline bg-surface p-4 flex items-center justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-subtle rounded w-2/5" />
            <div className="h-3 bg-subtle/70 rounded w-3/5" />
          </div>
          <div className="h-8 bg-subtle rounded w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}
