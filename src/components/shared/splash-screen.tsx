'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils/cn';

const SPLASH_SESSION_KEY = 'tan_sang_splash_seen';
const DEFAULT_DURATION_MS = 1800;
const EXIT_TRANSITION_MS = 400;

export interface SplashScreenProps {
  /** Force display the splash screen regardless of sessionStorage (useful for previews or manual triggers) */
  forceShow?: boolean;
  /** Auto-dismiss duration in milliseconds (default: 1800ms) */
  duration?: number;
  /** Callback fired when the splash animation completes and dismisses */
  onDismiss?: () => void;
  className?: string;
}

export function SplashScreen({
  forceShow = false,
  duration = DEFAULT_DURATION_MS,
  onDismiss,
  className,
}: SplashScreenProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
    } catch {
      // Ignore sessionStorage errors
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss?.();
    }, EXIT_TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [isExiting, onDismiss]);

  const showSplash = useCallback(() => {
    setIsExiting(false);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Check if splash has already been shown in this tab session
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SPLASH_SESSION_KEY) === 'true';
    } catch {
      // Ignore
    }

    if (forceShow || !alreadySeen) {
      showSplash();
    }

    // Global listener so user can replay the animation by clicking the logo
    const handleReplay = () => {
      showSplash();
    };

    window.addEventListener('tan_sang_replay_splash', handleReplay);
    return () => {
      window.removeEventListener('tan_sang_replay_splash', handleReplay);
    };
  }, [forceShow, showSplash]);

  useEffect(() => {
    if (!isVisible || isExiting) return;

    // Respect user's motion preferences
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dismiss();
      return;
    }

    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, isExiting, duration, dismiss]);

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label={t.splash.welcome}
      aria-live="polite"
      onClick={dismiss}
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas select-none cursor-pointer overflow-hidden transition-all duration-400 ease-out',
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100',
        className,
      )}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-72 w-72 rounded-full bg-gradient-to-tr from-chili/15 via-chili/10 to-transparent blur-3xl animate-soft-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xs">
        {/* Animated Mascot Emblem */}
        <div className="relative mb-6 flex flex-col items-center">
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-3 rounded-full bg-chili/10 blur-md animate-soft-pulse" />

          {/* Cute Mascot Card / Badge */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-surface border-2 border-chili/25 shadow-md p-3 animate-mascot-bounce">
            <div className="relative h-full w-full flex items-center justify-center animate-mascot-wiggle">
              <img
                src="/brand-mascot.png"
                alt={t.common.brandName}
                className="h-20 w-20 object-contain drop-shadow-sm transition-transform"
              />
            </div>
          </div>

          {/* Dynamic Ground Shadow that matches bounce */}
          <div className="mt-3.5 h-2 w-20 rounded-full bg-ink/10 blur-[2px] animate-mascot-shadow" />
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5 animate-pop-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
              {t.common.brandName}
            </h1>
            <span className="rounded-full bg-chili/10 px-2 py-0.5 text-xs font-mono font-semibold text-chili border border-chili/20">
              Tan-Sang
            </span>
          </div>
          <p className="text-xs font-medium text-ink-secondary leading-snug">
            {t.splash.slogan}
          </p>
        </div>

        {/* Loading Progress & Cute Dumpling Dots */}
        <div className="mt-7 flex flex-col items-center gap-2 w-full max-w-[180px]">
          <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden border border-hairline/60">
            <div className="h-full bg-gradient-to-r from-chili via-chili/90 to-chili rounded-full animate-splash-progress" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span className="font-medium">{t.splash.preparing}</span>
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="h-1 w-1 rounded-full bg-chili animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1 w-1 rounded-full bg-chili animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1 w-1 rounded-full bg-chili animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Subtle Tap to Skip Indicator */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="mt-8 rounded-full px-3 py-1 text-[11px] font-medium text-ink-muted hover:text-ink hover:bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-chili"
        >
          {t.splash.tapToSkip}
        </button>
      </div>
    </div>
  );
}
