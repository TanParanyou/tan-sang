'use client';

import React, { useState } from 'react';
import { KeyRound, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useI18n } from '@/lib/i18n/i18n-context';

export interface DeleteSessionButtonProps {
  sessionId: string;
  hostUserId: string;
  currentUserId: string;
  storeDisplayName: string;
  variant?: 'icon' | 'button' | 'menu-item';
  size?: 'sm' | 'md';
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
}

export function DeleteSessionButton({
  sessionId,
  hostUserId,
  currentUserId,
  storeDisplayName,
  variant = 'icon',
  size = 'md',
  className = '',
  buttonText,
  onSuccess,
  onError,
}: DeleteSessionButtonProps) {
  const { t } = useI18n();
  const isHost = Boolean(currentUserId && hostUserId && currentUserId === hostUserId);

  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultButtonText = buttonText ?? t.common.delete;

  const handleOpen = () => {
    setPin('');
    setPinError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isDeleting) return;
    setIsOpen(false);
    setPin('');
    setPinError(null);
  };

  const handleDelete = async () => {
    if (!pin.trim()) {
      setPinError(t.deleteModal.wrongPin);
      return;
    }

    setIsDeleting(true);
    setPinError(null);

    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostUserId: currentUserId,
          pin: pin.trim(),
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };

      if (!json.ok) {
        const errMsg = json.error?.message ?? 'Failed to delete session';
        setPinError(errMsg);
        onError?.(errMsg);
        return;
      }

      setIsOpen(false);
      onSuccess?.();
    } catch {
      const networkErr = 'Server connection error';
      setPinError(networkErr);
      onError?.(networkErr);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isHost) {
    return null;
  }

  return (
    <>
      {variant === 'icon' && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={defaultButtonText}
          title={defaultButtonText}
          className={`inline-flex items-center justify-center rounded-theme border border-hairline bg-surface text-ink-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition shadow-2xs ${
            size === 'sm' ? 'h-8 w-8 min-h-[32px] min-w-[32px]' : 'h-10 w-10 min-h-[40px] min-w-[40px]'
          } ${className}`}
        >
          <Trash2 className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
      )}

      {variant === 'button' && (
        <Button
          type="button"
          variant="destructive"
          size={size}
          onClick={handleOpen}
          className={`gap-1.5 font-semibold shadow-2xs ${className}`}
        >
          <Trash2 className="h-4 w-4" />
          <span>{defaultButtonText}</span>
        </Button>
      )}

      {variant === 'menu-item' && (
        <button
          type="button"
          onClick={handleOpen}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left ${className}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{defaultButtonText}</span>
        </button>
      )}

      {/* Confirmation & Host PIN Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none animate-fade-in backdrop-blur-2xs"
        >
          <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-6 shadow-theme">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 border border-red-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-session-title" className="text-base font-bold text-ink">
                  {t.deleteModal.title}
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {storeDisplayName}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-secondary leading-relaxed">
              {t.deleteModal.desc}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="host-pin-input" className="block text-xs font-semibold text-ink mb-1.5">
                  {t.deleteModal.pinLabel}
                </label>
                <div className="relative">
                  <input
                    id="host-pin-input"
                    type="password"
                    maxLength={10}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder={t.deleteModal.pinPlaceholder}
                    disabled={isDeleting}
                    className="w-full rounded-theme border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-ink-muted pointer-events-none" />
                </div>
                {pinError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {pinError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 min-h-[40px] text-xs"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={isDeleting || !pin.trim()}
                className="flex-1 min-h-[40px] text-xs font-semibold"
              >
                {isDeleting ? t.deleteModal.deleting : t.deleteModal.deleteButton}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
