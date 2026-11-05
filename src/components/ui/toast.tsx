import React from 'react';

export interface ToastProps {
  message: string | null;
  className?: string;
}

export function Toast({ message, className = '' }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-theme border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-lg print:hidden transition-all duration-200 ${className}`}
    >
      {message}
    </div>
  );
}
