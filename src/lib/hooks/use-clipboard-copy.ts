'use client';

import { useState, useCallback } from 'react';

export interface UseClipboardCopyOptions {
  duration?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: unknown) => void;
}

export function useClipboardCopy(options: UseClipboardCopyOptions = {}) {
  const { duration = 2000, onSuccess, onError } = options;
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const copy = useCallback(
    async (text: string, successMessage = 'คัดลอกเรียบร้อยแล้ว!') => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        notify('เบราว์เซอร์ไม่รองรับการคัดลอก');
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        notify(successMessage);
        onSuccess?.(text);

        setTimeout(() => {
          setIsCopied(false);
        }, duration);

        return true;
      } catch (err) {
        notify('ไม่สามารถคัดลอกข้อความได้');
        onError?.(err);
        return false;
      }
    },
    [duration, notify, onSuccess, onError],
  );

  return {
    copy,
    isCopied,
    toastMessage,
    setToastMessage,
    notify,
  };
}
