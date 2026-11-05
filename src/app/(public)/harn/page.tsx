import type { Metadata } from 'next';
import { constructMetadata } from '@/config/site';
import { SplitCalculatorClient } from '@/features/split-calculator/split-calculator-client';

export const dynamic = 'force-static';

export const metadata: Metadata = constructMetadata({
  title: 'ตาลหาร (Tan-Harn) — เครื่องคิดเลขหารค่าข้าว & ปันส่วนลด',
  description:
    'เครื่องมือหารค่าอาหาร ค่าส่ง และเฉลี่ยโค้ดส่วนลดตามสัดส่วน สรุปยอดแยกรายคน คัดลอกส่งต่อบอทขุนทองหรือกลุ่ม LINE ได้ทันที',
});

export default function HarnPage() {
  return <SplitCalculatorClient />;
}
