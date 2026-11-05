'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { th, type TranslationKeys } from '@/messages/th';
import { en } from '@/messages/en';
import type { SupportedLocale } from '@/lib/utils/i18n.schema';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
  t: TranslationKeys;
  isMounted: boolean;
}

const dictionaries: Record<SupportedLocale, TranslationKeys> = { th, en };

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'tan_sang_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('th');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved === 'th' || saved === 'en') {
        setLocaleState(saved);
        return;
      }

      // Check browser or LINE Webview language
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
        setLocaleState('en');
      }
    } catch {
      // LocalStorage access might fail in restricted Webviews
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'th' ? 'en' : 'th');
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t: dictionaries[locale],
        isMounted,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
