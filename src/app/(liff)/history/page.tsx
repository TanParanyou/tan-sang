import type { Metadata } from 'next';
import { OrderHistoryClient } from '@/features/order-session/order-history-client';
import { getOrderSessionService } from '@/server/container';
import { constructMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'ประวัติการสั่งอาหาร',
  description: 'ดูประวัติการเปิดบิลสั่งอาหารกลุ่มย้อนหลัง',
  noIndex: true,
});

export default async function OrderHistoryPage() {
  const service = getOrderSessionService();
  const initialHistory = await service.listSessionHistory();

  return <OrderHistoryClient initialHistory={initialHistory} />;
}
