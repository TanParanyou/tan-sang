import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceiptClient } from '@/features/receipt/receipt-client';
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
    title: `สรุปบิล & ใบเสร็จ #${shortId}`,
    description: 'ดูสรุปยอดคำสั่งซื้อ ยอดแยกรายคน และพิมพ์ใบเสร็จ',
    noIndex: true,
  });
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const service = getOrderSessionService();

  try {
    const { session, summary } = await service.getSessionDetail(sessionId);
    return <ReceiptClient session={session} summary={summary} />;
  } catch (error) {
    if (error instanceof DomainError && error.code === 'RESOURCE_NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
