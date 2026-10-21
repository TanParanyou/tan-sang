import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DEMO_SESSION_ID } from '@/server/container';
import { constructMetadata } from '@/config/site';

export const metadata: Metadata = constructMetadata({
  title: 'ระบบจัดการร้านค้า (Admin)',
  description: 'ระบบจัดการร้านค้าและเมนูอาหาร Tan-Sang',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-sm font-bold tracking-tight text-chili">
              TAN-SANG ADMIN
            </Link>
            <nav className="flex items-center gap-3 text-xs font-medium text-ink-secondary">
              <Link href="/admin/stores" className="hover:text-ink">
                ร้านค้าทั้งหมด
              </Link>
              <Link href={`/order/${DEMO_SESSION_ID}`} className="hover:text-ink">
                หน้าสั่งอาหาร (Demo)
              </Link>
            </nav>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-ink-secondary underline-offset-2 hover:text-ink hover:underline"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
