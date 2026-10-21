import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, bordered = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface rounded-theme text-ink border border-hairline shadow-xs',
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
