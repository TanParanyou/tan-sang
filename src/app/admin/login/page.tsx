'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';

const EXPECTED_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '1234';

export default function AdminLoginPage() {
  const router = useRouter();
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
      setError('รหัสผ่านผู้ดูแลไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-hairline bg-surface p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chili-subtle text-chili">
        <KeyRound className="h-5 w-5" />
      </div>

      <h1 className="mt-3 text-lg font-semibold text-ink">เข้าสู่ระบบผู้ดูแลร้าน (Admin)</h1>
      <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
        สำหรับจัดการรายชื่อร้านค้า เพิ่ม/ลบเมนู ตั้งราคาธรรมดา/พิเศษ และท็อปปิ้ง
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="admin-passcode" className="block text-xs font-semibold text-ink">
            รหัสผ่านผู้ดูแล (Admin Passcode)
          </label>
          <div className="relative mt-1">
            <input
              id="admin-passcode"
              type="password"
              required
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="กรอกรหัสผ่าน (เช่น 1234)"
              className="min-h-[44px] w-full rounded-lg border border-hairline bg-canvas px-3 text-sm font-mono text-ink tabular-nums focus:border-chili focus:outline-none"
            />
          </div>
          {error ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
          ) : (
            <p className="mt-1 text-[11px] text-ink-muted">
              * รหัสเริ่มต้นสำหรับทดสอบระบบ: <strong className="font-mono text-ink">1234</strong>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !passcode.trim()}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-chili px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-chili-hover disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          เข้าสู่ระบบผู้ดูแล
        </button>
      </form>
    </div>
  );
}
