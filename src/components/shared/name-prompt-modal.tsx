'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Button, Input } from '@/components/ui';

export interface NamePromptModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (name: string) => void;
  currentName?: string;
  canClose?: boolean;
}

export function NamePromptModal({
  isOpen,
  onClose,
  onSave,
  currentName = '',
  canClose = true,
}: NamePromptModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // If currentName is the default placeholder, don't prefill with default
      const defaultPlaceholder = 'ฉัน (ผู้สั่งอาหาร)';
      setName(currentName && currentName !== defaultPlaceholder ? currentName : '');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.nameModal.requiredError);
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > 30) {
      setError(t.nameModal.maxError);
      inputRef.current?.focus();
      return;
    }
    onSave(trimmed);
    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none animate-fade-in backdrop-blur-2xs"
    >
      <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-6 shadow-theme">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chili/10 text-chili border border-chili/20">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="name-modal-title" className="text-base font-bold text-ink">
                {t.nameModal.title}
              </h2>
              <p className="text-xs text-ink-secondary">
                {t.nameModal.desc}
              </p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-theme p-1 text-ink-muted hover:text-ink transition hover:bg-subtle"
              aria-label={t.common.close}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="user-display-name-input" className="block text-xs font-semibold text-ink mb-1.5">
              {t.nameModal.inputLabel} <span className="text-chili">*</span>
            </label>
            <Input
              id="user-display-name-input"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.nameModal.placeholder}
              maxLength={30}
              className="text-sm font-medium"
            />
            {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {canClose && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSkip}
                className="min-h-[40px] text-xs"
              >
                {t.common.cancel}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!name.trim()}
              className="min-h-[40px] gap-1.5 text-xs font-semibold px-5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{t.nameModal.saveButton}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
