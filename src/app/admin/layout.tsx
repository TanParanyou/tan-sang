import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { AppNavbar } from '@/components/shared/app-navbar';
import { constructMetadata } from '@/config/site';

export const metadata: Metadata = constructMetadata({
  title: 'ระบบจัดการร้านค้า (Admin) — ตาลสั่ง',
  description: 'ระบบจัดการร้านค้าและเมนูอาหาร ตาลสั่ง (Tan-Sang)',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <AppNavbar
        backHref="/"
        backLabel="หน้าแรก"
        title="ระบบจัดการร้านค้า"
        badge={
          <span className="rounded bg-chili/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-chili">
            ADMIN
          </span>
        }
        actions={
          <Link
            href="/admin/stores"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-subtle"
          >
            <Store className="h-3.5 w-3.5 text-chili" />
            <span>รายชื่อร้านค้า</span>
          </Link>
        }
      />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
