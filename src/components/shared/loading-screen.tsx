'use client';

import React from 'react';
import { Loader2, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = 'กำลังโหลดข้อมูล...',
  className,
  fullScreen = false,
}: LoadingScreenProps) {
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
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-subtle border border-hairline shadow-xs">
        <Utensils className="h-6 w-6 text-chili" />
        <Loader2 className="absolute -inset-1.5 h-[68px] w-[68px] animate-spin text-chili/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{message}</p>
        <p className="text-xs text-ink-muted">กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุด</p>
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
