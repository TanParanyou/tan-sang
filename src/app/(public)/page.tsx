import type { Metadata } from 'next';
import Link from 'next/link';
import { History } from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { QuickStartSessionForm } from '@/features/order-session/quick-start-session-form';
import { getRepositories } from '@/server/container';
import { constructMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'ตาลสั่ง (Tan-Sang) — เปิดบิลสั่งอาหารกลุ่มใน LINE',
  description:
    'เปิดบิลสั่งอาหารกลุ่มในแชท LINE สมาชิกเลือกเมนู ท็อปปิ้ง แยกบิลรายคน คัดลอกส่งร้านค้าได้ทันที',
});

export default async function PublicLandingPage() {
  const { storeRepo } = getRepositories();
  const stores = await storeRepo.findActiveStores();

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <DevPersonaBar />
      <AppNavbar
        actions={
          <Link
            href="/history"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-subtle"
          >
            <History className="h-3.5 w-3.5 text-chili" />
            <span>ประวัติบิล</span>
          </Link>
        }
      />

      <main className="mx-auto max-w-xl px-4 py-8">
        {/* Host Quick Start New Session */}
        <section aria-label="เปิดบิลห้องสั่งอาหารใหม่">
          <QuickStartSessionForm stores={stores} />
        </section>
      </main>
    </div>
  );
}
