import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, History, PlusCircle, ShieldCheck, Store as StoreIcon, Utensils } from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { QuickStartSessionForm } from '@/features/order-session/quick-start-session-form';
import { getRepositories } from '@/server/container';
import { Button, Card, Badge } from '@/components/ui';
import { constructMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'ตาลสั่ง (Tan-Sang) — เปิดบิลสั่งอาหารกลุ่มใน LINE',
  description:
    'เปิดบิลสั่งอาหารกลุ่มในแชท LINE สมาชิกเลือกเมนู ท็อปปิ้ง แยกบิลรายคน คัดลอกส่งร้านค้าได้ทันที',
});

export default async function PublicLandingPage() {
  const { storeRepo, isLiveSupabase } = getRepositories();
  const stores = await storeRepo.findActiveStores();

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <DevPersonaBar />
      <AppNavbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="rounded-theme border border-hairline bg-surface p-6 sm:p-8 shadow-xs">
          <Badge variant="default" className="mb-3.5 bg-chili/10 text-chili border-chili/20">
            <Utensils className="h-3.5 w-3.5" />
            ตาลสั่ง (Tan-Sang) • LINE Group Food Ordering
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl leading-snug">
            เปิดบิลสั่งอาหารกลุ่มในแชท LINE จบครบในลิงก์เดียว
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary sm:text-base">
            สมาชิกกดเลือกเมนู ขนาด ท็อปปิ้ง และกดสถานะพร้อม เมื่อครบแล้ว Host
            กดล็อกห้องเพื่อคัดลอกข้อความส่งร้านค้า แยกยอดรายคน หรือสั่งพิมพ์ใบเสร็จ 80mm / A4 ได้ทันที
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-hairline font-mono text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isLiveSupabase
                ? 'Connected to Supabase PostgreSQL'
                : 'Local Pre-seeded Demo Store'}
            </span>
            <span>•</span>
            <span>ร้านค้าพร้อมให้บริการ {stores.length} ร้าน</span>
          </div>
        </div>

        {/* Host Quick Start New Session */}
        <section aria-label="เปิดบิลห้องสั่งอาหารใหม่">
          <QuickStartSessionForm stores={stores} />
        </section>

        {/* Action Links & Hub Navigation */}
        <section className="space-y-4" aria-label="เมนูและการจัดการ">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink-secondary">
              เมนูและการจัดการ (Quick Navigation)
            </h2>
            <span className="text-xs text-ink-muted">เลือกดูบิลหรือจัดการร้าน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/history"
              className="group flex flex-col justify-between rounded-theme border border-hairline bg-surface p-5 transition-all hover:border-ink hover:shadow-sm"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-theme bg-subtle text-chili mb-3 group-hover:bg-chili group-hover:text-white transition-colors border border-hairline">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-chili transition-colors">
                  ประวัติบิลและการสั่งอาหาร
                </h3>
                <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                  ดูรายการบิลที่เปิดอยู่และบิลที่ปิดแล้ว สรุปยอดรวม และดูใบเสร็จ
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-ink">
                <span>ดูประวัติบิลทั้งหมด</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin/stores"
              className="group flex flex-col justify-between rounded-theme border border-hairline bg-surface p-5 transition-all hover:border-ink hover:shadow-sm"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-theme bg-subtle text-ink mb-3 group-hover:bg-ink group-hover:text-surface transition-colors border border-hairline">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-chili transition-colors">
                  ระบบจัดการร้านค้าและเมนูอาหาร
                </h3>
                <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                  เพิ่มร้านค้า จัดการเมนู กำหนดราคาธรรมดา/พิเศษ ท็อปปิ้ง และโหวตแบนเมนู
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-ink">
                <span>เข้าสู่ระบบจัดการร้าน</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
