import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Printer, Store as StoreIcon, Utensils } from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { QuickStartSessionForm } from '@/features/order-session/quick-start-session-form';
import { DEMO_SESSION_ID, getRepositories } from '@/server/container';
import { Button, Card, Badge } from '@/components/ui';
import { constructMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Tan-Sang (ทันสั่ง) — เปิดบิลสั่งอาหารกลุ่มใน LINE',
  description:
    'เปิดบิลสั่งอาหารกลุ่มในแชท LINE สมาชิกเลือกเมนู ท็อปปิ้ง แยกบิลรายคน คัดลอกส่งร้านค้าได้ทันที',
});

export default async function PublicLandingPage() {
  const { storeRepo, isLiveSupabase } = getRepositories();
  const stores = await storeRepo.findActiveStores();

  return (
    <div className="min-h-screen bg-canvas">
      <DevPersonaBar />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="border-b border-hairline pb-6">
          <Badge variant="default" className="mb-3">
            <Utensils className="h-3 w-3" />
            ตาลสั่ง (Tan-Sang) • LINE Group Food Ordering
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            เปิดบิลสั่งอาหารกลุ่มในแชท LINE จบครบในลิงก์เดียว
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            สมาชิกกดเลือกเมนู ขนาด ท็อปปิ้ง และกด Ready เมื่อครบแล้ว Host
            กดล็อกห้องเพื่อคัดลอกข้อความส่งร้านค้า แยกยอดรายคน หรือสั่งพิมพ์ใบเสร็จ 80mm / A4 ได้ทันที
          </p>
          <p className="mt-3 font-mono text-xs text-ink-muted">
            Data Mode:{' '}
            {isLiveSupabase
              ? '🟢 Connected to Supabase PostgreSQL'
              : '⚪ Local Pre-seeded Demo Store (พร้อมทดสอบทันที)'}
          </p>
        </div>

        {/* Host Quick Start New Session */}
        <section className="mt-6" aria-label="เปิดบิลห้องสั่งอาหารใหม่">
          <QuickStartSessionForm stores={stores} />
        </section>

        {/* Quick Action Links */}
        <section className="mt-8 space-y-3" aria-label="ทางลัดสำหรับทดสอบระบบ">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-secondary">
            ทางลัดเข้าใช้งานห้องตัวอย่าง (Pre-loaded Demo Session)
          </h2>

          <Card className="divide-y divide-hairline overflow-hidden">
            <Link
              href={`/order/${DEMO_SESSION_ID}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-subtle"
            >
              <div>
                <p className="text-base font-semibold text-ink">
                  1. หน้าสั่งอาหารกลุ่ม (LIFF Order View)
                </p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  ทดสอบเลือกเมนู แก้ไขรายการ สลับตัวละคร (Host / สมาชิก) กด Ready และล็อกบิล
                </p>
              </div>
              <Button size="sm" variant="primary" className="shrink-0 pointer-events-none">
                เปิดห้องตัวอย่าง
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>

            <Link
              href={`/receipt/${DEMO_SESSION_ID}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-subtle"
            >
              <div>
                <p className="text-base font-semibold text-ink">
                  2. หน้าใบเสร็จ & แชร์เข้า LINE (Printable Receipt 80mm / A4)
                </p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  สลับมุมมองสลิปความร้อน 80mm / A4, คัดลอกข้อความส่งร้าน และ Share to LINE
                </p>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0 pointer-events-none">
                <Printer className="h-3.5 w-3.5" />
                ดูใบเสร็จ
              </Button>
            </Link>

            <Link
              href="/admin/stores"
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-subtle"
            >
              <div>
                <p className="text-base font-semibold text-ink">
                  3. ระบบจัดการร้านค้าและเมนูอาหาร (Admin Console)
                </p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  เพิ่มร้านค้า ตั้งค่าราคาธรรมดา/พิเศษ ท็อปปิ้ง และโหวตแบนเมนูไม่อร่อย
                </p>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0 pointer-events-none">
                <StoreIcon className="h-3.5 w-3.5" />
                จัดการร้าน
              </Button>
            </Link>
          </Card>
        </section>
      </main>
    </div>
  );
}
