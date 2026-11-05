'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

const EXPECTED_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '1234';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (passcode.trim() === EXPECTED_PASSCODE) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tan_sang_admin_auth', 'true');
        document.cookie = 'tan_sang_admin_passcode=1234; path=/; max-age=86400';
      }
      router.push('/admin/stores');
    } else {
      setError(t.storeAdmin.loginFailed);
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-hairline bg-surface p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chili-subtle text-chili">
        <KeyRound className="h-5 w-5" />
      </div>

      <h1 className="mt-3 text-lg font-semibold text-ink">{t.storeAdmin.adminLoginTitle}</h1>
      <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
        {t.storeAdmin.adminLoginDesc}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="admin-passcode" className="block text-xs font-semibold text-ink">
            {t.storeAdmin.passcodeLabel}
          </label>
          <div className="relative mt-1">
            <input
              id="admin-passcode"
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.storeAdmin.passcodePlaceholder}
              autoFocus
              className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-chili focus:ring-1 focus:ring-chili"
            />
            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-ink-muted" />
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-chili py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-chili-hover disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{isLoading ? t.common.loading : t.storeAdmin.loginButton}</span>
        </button>
      </form>
    </div>
  );
}
