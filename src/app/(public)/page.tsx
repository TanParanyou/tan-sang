import type { Metadata } from 'next';
import Link from 'next/link';
import { History } from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { QuickStartSessionForm } from '@/features/order-session/quick-start-session-form';
import { getRepositories } from '@/server/container';
import { constructMetadata, siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'ตาลสั่ง (Tan-Sang) — เปิดบิลสั่งอาหารกลุ่มใน LINE',
  description:
    'เปิดบิลสั่งอาหารกลุ่มในแชท LINE สมาชิกเลือกเมนู ท็อปปิ้ง แยกบิลรายคน คัดลอกส่งร้านค้าได้ทันที',
});

export default async function PublicLandingPage() {
  const { storeRepo } = getRepositories();
  const stores = await storeRepo.findActiveStores();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ตาลสั่ง (Tan-Sang)',
    alternateName: ['ตาลสั่ง', 'ทันสั่ง', 'Tan-Sang'],
    applicationCategory: 'FoodApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    url: siteConfig.url,
    description: siteConfig.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'THB',
    },
    featureList: [
      'เปิดบิลสั่งอาหารกลุ่มใน LINE',
      'เลือกเมนูและท็อปปิ้งพร้อมระบุชื่อคนสั่ง',
      'ระบบรวมรายการซ้ำคัดลอกส่งร้านค้าในคลิกเดียว',
      'คิดเงินและแยกยอดตามรายคนสำหรับส่งต่อให้ขุนทองช่วยหารบิล',
      'พิมพ์ใบเสร็จขนาด 80mm และ A4',
    ],
    inLanguage: 'th-TH',
  };

  return (
    <div className="min-h-screen bg-canvas pb-24">
      {/* Schema.org Structured Data for Rich Search Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
