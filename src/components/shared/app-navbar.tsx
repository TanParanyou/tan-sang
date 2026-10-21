'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AppNavbarProps {
  /** Page or context title */
  title?: React.ReactNode;
  /** Subtitle or secondary description */
  subtitle?: React.ReactNode;
  /** Optional badge next to title (e.g. status badge) */
  badge?: React.ReactNode;
  /** URL for the back navigation button */
  backHref?: string;
  /** Optional back button label (e.g. "ย้อนกลับ", "หน้าแรก") */
  backLabel?: string;
  /** Callback for custom back navigation (e.g. router.back) */
  onBack?: () => void;
  /** Action elements on the right side of the navbar */
  actions?: React.ReactNode;
  /** Optional secondary content below main bar (e.g. ready members, filter tabs) */
  subHeader?: React.ReactNode;
  /** Custom max-width class (default: max-w-4xl) */
  maxWidthClassName?: string;
  className?: string;
}

export function AppNavbar({
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
  onBack,
  actions,
  subHeader,
  maxWidthClassName = 'max-w-4xl',
  className,
}: AppNavbarProps) {
  const hasBack = Boolean(backHref || onBack);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 w-full border-b border-hairline bg-surface/95 backdrop-blur-md',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex min-h-[56px] h-14 items-center justify-between gap-3 px-4 sm:px-6',
          maxWidthClassName,
        )}
      >
        {/* Left Section: Back Button or Brand Logo */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {hasBack ? (
            <div className="flex shrink-0 items-center gap-1.5">
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={backLabel ?? 'ย้อนกลับ'}
                  className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary transition hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili shadow-2xs"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label={backLabel ?? 'ย้อนกลับ'}
                  className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary transition hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili shadow-2xs"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {backLabel && (
                <span className="hidden text-xs font-medium text-ink-secondary sm:inline">
                  {backLabel}
                </span>
              )}
            </div>
          ) : (
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili rounded-theme"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-chili text-white shadow-xs border border-chili">
                <Utensils className="h-4 w-4" />
              </div>
              {!title && (
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-ink text-sm sm:text-base leading-none">
                    ตาลสั่ง <span className="text-xs font-mono font-medium text-ink-muted">(Tan-Sang)</span>
                  </span>
                  <span className="text-[10px] text-ink-secondary leading-tight hidden sm:inline">
                    LINE Group Food Ordering
                  </span>
                </div>
              )}
            </Link>
          )}

          {/* Title & Badge / Subtitle */}
          {title && (
            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold tracking-tight text-ink text-sm sm:text-base leading-tight">
                  {title}
                </span>
                {badge}
              </div>
              {subtitle && (
                <div className="truncate text-xs text-ink-secondary leading-tight mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* SubHeader Section (e.g. Ready Participants Strip, Sub-tabs) */}
      {subHeader && (
        <div className="border-t border-hairline bg-surface/75 px-4 sm:px-6">
          <div className={cn('mx-auto', maxWidthClassName)}>{subHeader}</div>
        </div>
      )}
    </header>
  );
}
