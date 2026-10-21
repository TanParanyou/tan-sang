import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrderSessionClient } from '@/features/order-session/order-session-client';
import { getOrderSessionService } from '@/server/container';
import { DomainError } from '@/server/errors/domain.error';
import { constructMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const shortId = sessionId.slice(0, 8);
  return constructMetadata({
    title: `ห้องสั่งอาหาร #${shortId}`,
    description: 'เลือกเมนู ท็อปปิ้ง และระบุรายละเอียดการสั่งอาหารในห้องนี้',
    noIndex: true,
  });
}

export default async function OrderSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const service = getOrderSessionService();

  try {
    const initialData = await service.getSessionDetail(sessionId);
    return <OrderSessionClient sessionId={sessionId} initialData={initialData} />;
  } catch (error) {
    if (error instanceof DomainError && error.code === 'RESOURCE_NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
