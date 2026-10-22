import React, { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      checked,
      defaultChecked,
      disabled,
      onChange,
      id,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer select-none text-ink',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          containerClassName,
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded-[6px] border border-hairline bg-surface transition-all flex items-center justify-center',
              'peer-checked:bg-ink peer-checked:border-ink peer-checked:[&>svg]:opacity-100',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-1',
              'hover:border-ink-secondary',
              className,
            )}
          >
            <Check
              className="h-3.5 w-3.5 text-surface opacity-0 transition-opacity"
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-ink">{label}</span>}
            {description && (
              <span className="text-xs text-ink-secondary">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
