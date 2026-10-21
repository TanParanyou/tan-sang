import React, { useId } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, required, id, containerClassName, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>
              {label} {required && <span className="text-red-500 font-bold">*</span>}
            </span>
            {helperText && <span className="text-[11px] font-normal text-ink-secondary">{helperText}</span>}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border rounded-theme transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
              error ? 'border-red-500 focus:ring-red-500' : 'border-hairline hover:border-ink-secondary',
              disabled && 'bg-subtle text-ink-muted cursor-not-allowed border-hairline',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, required, id, containerClassName, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>
              {label} {required && <span className="text-red-500 font-bold">*</span>}
            </span>
            {helperText && <span className="text-[11px] font-normal text-ink-secondary">{helperText}</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[80px] p-3 bg-surface text-ink text-[16px] border rounded-theme transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
            error ? 'border-red-500 focus:ring-red-500' : 'border-hairline hover:border-ink-secondary',
            disabled && 'bg-subtle text-ink-muted cursor-not-allowed border-hairline',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, required, id, containerClassName, disabled, children, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>
              {label} {required && <span className="text-red-500 font-bold">*</span>}
            </span>
            {helperText && <span className="text-[11px] font-normal text-ink-secondary">{helperText}</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[44px] h-[44px] px-3 bg-surface text-ink text-[16px] border rounded-theme transition-colors focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
            error ? 'border-red-500 focus:ring-red-500' : 'border-hairline hover:border-ink-secondary',
            disabled && 'bg-subtle text-ink-muted cursor-not-allowed border-hairline',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
