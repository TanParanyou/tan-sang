import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Store, History } from 'lucide-react';
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
      <AppNavbar />
      <div className="border-b border-hairline bg-surface/50 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 text-ink-secondary">
            <span className="font-mono font-semibold text-chili">ADMIN CONSOLE</span>
            <span>•</span>
            <Link href="/admin/stores" className="hover:text-ink font-medium">
              รายชื่อร้านค้า
            </Link>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-ink-secondary hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
