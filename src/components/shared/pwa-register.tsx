'use client';

import { useEffect } from 'react';

/**
 * Pragmatic Service Worker Registration for Tan-Sang PWA
 * Safely registers /sw.js in production environments without blocking UI rendering.
 */
export function PwaRegister() {
  useEffect(() => {
    const isServiceWorkerSupported =
      typeof window !== 'undefined' && 'serviceWorker' in navigator;

    const shouldRegister =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (isServiceWorkerSupported && shouldRegister) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad, { once: true });
      }
    }
  }, []);

  return null;
}
