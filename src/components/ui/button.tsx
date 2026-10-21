import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, loading = false, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 rounded-theme';

    const variantStyles = {
      primary: 'bg-ink text-surface border border-ink hover:bg-neutral-800 active:bg-black shadow-xs',
      secondary: 'bg-surface text-ink border border-hairline hover:bg-subtle active:bg-neutral-200 shadow-xs',
      ghost: 'bg-transparent text-ink border border-transparent hover:border-hairline hover:bg-subtle active:bg-neutral-200',
      destructive: 'bg-red-600 text-white border border-red-700 hover:bg-red-700 active:bg-red-800 shadow-xs',
    };

    // Heights aligned with mobile ergonomics: md and lg are standard touch targets (40px/44px)
    const sizeStyles = {
      sm: 'min-h-[32px] h-[32px] px-3 text-xs gap-1.5',
      md: 'min-h-[44px] h-[44px] px-4 text-sm gap-2',
      lg: 'min-h-[48px] h-[48px] px-5 text-base gap-2',
    };

    const isDisabled = disabled || loading;
    const disabledStyles = isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], disabledStyles, className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
