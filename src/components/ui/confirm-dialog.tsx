'use client';

import React, { useEffect } from 'react';
import { Button } from './button';
import { useI18n } from '@/lib/i18n/i18n-context';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  type?: 'confirm' | 'alert';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'primary',
  loading = false,
  type = 'confirm',
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const resolvedConfirmText = confirmText ?? t.common.confirm;
  const resolvedCancelText = cancelText ?? t.common.cancel;
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  const confirmVariant = variant === 'danger' ? 'destructive' : 'primary';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none"
    >
      <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-5 shadow-theme">
        <h2 id="confirm-dialog-title" className="text-base font-bold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-xs leading-relaxed text-ink-secondary whitespace-pre-wrap">
          {description}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {type === 'confirm' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={onClose}
              className="min-h-[36px]"
            >
              {resolvedCancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
            className="min-h-[36px]"
          >
            {type === 'alert' && !confirmText ? t.common.confirm : resolvedConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

