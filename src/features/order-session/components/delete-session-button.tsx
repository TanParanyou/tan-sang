'use client';

import React, { useState } from 'react';
import { KeyRound, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  buttonText = 'ลบบิล',
  onSuccess,
  onError,
}: DeleteSessionButtonProps) {
  const isHost = Boolean(currentUserId && hostUserId && currentUserId === hostUserId);

  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const executeDelete = async (pinValue?: string) => {
    try {
      setIsDeleting(true);
      setPinError(null);

      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUserId,
          ...(pinValue ? { pin: pinValue } : {}),
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };

      if (!json.ok) {
        const errorMsg = json.error?.message || 'ไม่สามารถลบบิลได้';
        if (!isHost) {
          setPinError(errorMsg);
        }
        onError?.(errorMsg);
        return;
      }

      setIsOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบบิล';
      if (!isHost) {
        setPinError(errorMsg);
      }
      onError?.(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError('กรุณากรอกรหัส PIN ก่อนดำเนินการ');
      return;
    }
    executeDelete(pin.trim());
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`ลบบิล ${storeDisplayName}`}
          title="ลบบิลสั่งอาหาร"
          className={
            className ||
            'inline-flex min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary shadow-2xs transition hover:bg-red-50 hover:text-red-600 hover:border-red-300'
          }
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : variant === 'menu-item' ? (
        <button
          type="button"
          onClick={handleOpen}
          role="menuitem"
          className={
            className ||
            'group flex w-full items-center gap-2.5 rounded-theme px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 active:bg-red-100 text-left select-none'
          }
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-red-500 group-hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </span>
          <span className="truncate">{buttonText || 'ลบบิลสั่งอาหาร'}</span>
        </button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size={size}
          onClick={handleOpen}
          className={className}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{buttonText}</span>
        </Button>
      )}

      {/* 1. Host Confirmation Dialog */}
      {isHost && (
        <ConfirmDialog
          isOpen={isOpen}
          onClose={handleClose}
          onConfirm={() => executeDelete()}
          title="ยืนยันการลบบิล"
          description={`คุณต้องการลบบิลร้าน "${storeDisplayName}" ใช่หรือไม่?\n\nคำเตือน: ข้อมูลและรายการอาหารทั้งหมดในห้องนี้จะถูกลบถาวร และไม่สามารถกู้คืนได้`}
          confirmText="ยืนยันลบบิล"
          cancelText="ยกเลิก"
          variant="danger"
          loading={isDeleting}
        />
      )}

      {/* 2. Non-Host PIN Confirmation Modal */}
      {!isHost && isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none"
        >
          <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-5 shadow-theme">
            <div className="flex h-10 w-10 items-center justify-center rounded-theme bg-red-50 text-red-600">
              <KeyRound className="h-5 w-5" />
            </div>

            <h2 id="pin-modal-title" className="mt-3 text-base font-bold text-ink">
              ยืนยันการลบบิล (ต้องใช้รหัส PIN)
            </h2>
            <p className="mt-1.5 text-xs text-ink-secondary leading-relaxed">
              คุณไม่ใช่หัวหน้าห้อง (Host) ของบิลร้าน{' '}
              <strong className="text-ink">"{storeDisplayName}"</strong>
              <br />
              หากต้องการลบบิล กรุณากรอกรหัส Admin PIN เพื่อยืนยัน
            </p>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="delete-session-pin" className="block text-xs font-semibold text-ink">
                  รหัส Admin PIN
                </label>
                <div className="relative mt-1">
                  <input
                    id="delete-session-pin"
                    type="password"
                    required
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="กรอกรหัส PIN (เช่น 1234)"
                    className="min-h-[42px] w-full rounded-theme border border-hairline bg-canvas px-3 text-sm font-mono text-ink tabular-nums focus:border-red-500 focus:outline-none"
                  />
                </div>
                {pinError && <p className="mt-1.5 text-xs font-medium text-red-600">{pinError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleClose}
                  className="min-h-[36px]"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  loading={isDeleting}
                  disabled={isDeleting || !pin.trim()}
                  className="min-h-[36px]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>ยืนยันลบบิล</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
