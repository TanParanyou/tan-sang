import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, History } from 'lucide-react';
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
      'ตาลหาร: เครื่องคิดเลขหารค่าข้าว ค่าส่ง และส่วนลดด่วน',
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
          <div className="flex items-center gap-1.5">
            <Link
              href="/harn"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-chili/30 bg-chili/5 px-3 py-1.5 text-xs font-semibold text-chili shadow-2xs transition hover:bg-chili/10"
            >
              <Calculator className="h-3.5 w-3.5 text-chili" />
              <span>ตาลหาร</span>
            </Link>
            <Link
              href="/history"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-subtle"
            >
              <History className="h-3.5 w-3.5 text-ink-muted" />
              <span>ประวัติบิล</span>
            </Link>
          </div>
        }
      />

      <main className="mx-auto max-w-xl px-4 py-8 space-y-6">
        {/* Tan-Harn Standalone Feature Card */}
        <section aria-label="ตาลหาร เครื่องคิดเลขหารค่าข้าวด่วน">
          <div className="rounded-theme border border-hairline bg-surface p-4 shadow-xs transition hover:border-chili/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-theme bg-chili/10 text-chili">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-ink">ตาลหาร (Tan-Harn)</h2>
                    <span className="rounded-full bg-chili/10 px-2 py-0.5 text-[10px] font-bold text-chili">
                      ใหม่
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    มีบิลอยู่แล้ว อยากคิดเงินด่วน? หารค่าข้าว เฉลี่ยค่าส่ง และปันส่วนลดตามสัดส่วนได้ทันที
                  </p>
                </div>
              </div>
              <Link
                href="/harn"
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-theme bg-chili px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-chili/90 transition"
              >
                <span>เปิดใช้งาน</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Host Quick Start New Session */}
        <section aria-label="เปิดบิลห้องสั่งอาหารใหม่">
          <QuickStartSessionForm stores={stores} />
        </section>
      </main>
    </div>
  );
}
