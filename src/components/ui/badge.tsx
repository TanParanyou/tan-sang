import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'muted' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-theme uppercase tracking-wider select-none border';

    const variantStyles = {
      default: 'bg-ink text-surface border-ink',
      success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      warning: 'bg-amber-50 text-amber-900 border-amber-300',
      muted: 'bg-subtle text-ink-secondary border-hairline',
      outline: 'bg-surface text-ink border-hairline',
    };

    return <span ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props} />;
  },
);

Badge.displayName = 'Badge';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex min-h-[36px] h-[36px] items-center justify-center px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-theme border select-none focus:outline-none focus:ring-1 focus:ring-ink',
          selected
            ? 'bg-ink text-surface border-ink'
            : 'bg-surface text-ink-secondary border-hairline hover:border-ink hover:text-ink',
          className,
        )}
        {...props}
      />
    );
  },
);

Chip.displayName = 'Chip';
