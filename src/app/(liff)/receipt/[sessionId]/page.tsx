import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ReceiptClient } from '@/features/receipt/receipt-client';
import { getOrderSessionService } from '@/server/container';
import { DomainError } from '@/server/errors/domain.error';
import { constructMetadata } from '@/config/site';
import { formatGrandTotal } from '@/lib/utils/price';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const shortId = sessionId.slice(0, 8);
  const service = getOrderSessionService();

  try {
    const { summary } = await service.getSessionDetail(sessionId);
    const storeName = summary.storeDisplayName || 'สั่งอาหารกลุ่ม';
    const totalCount = summary.totalItemsCount;
    const grandTotal = formatGrandTotal(summary.grandTotalAmount, 'บาท');
    const priceText = grandTotal ? `ยอดรวม ${grandTotal}` : 'รอร้านคิดเงิน';

    const title = `จัดการบิล: ${storeName} #${shortId}`;
    const description = `สรุปบิล ${storeName} (${totalCount} จาน • ${priceText}) ดูสรุปยอดแยกรายคนและพิมพ์ใบเสร็จ`;

    return constructMetadata({
      title,
      description,
      canonicalUrl: `/receipt/${sessionId}`,
      noIndex: true,
    });
  } catch {
    return constructMetadata({
      title: `จัดการบิล & ใบเสร็จ #${shortId}`,
      description: 'ดูสรุปยอดคำสั่งซื้อ ยอดแยกรายคน และพิมพ์ใบเสร็จ',
      canonicalUrl: `/receipt/${sessionId}`,
      noIndex: true,
    });
  }
}

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ shared?: string; view?: string }>;
}) {
  const { sessionId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // If visitor is requesting shared slip view, redirect cleanly to dedicated /receipt/[sessionId]/slip page
  if (
    resolvedSearchParams.shared === '1' ||
    resolvedSearchParams.view === 'shared' ||
    resolvedSearchParams.view === 'slip'
  ) {
    redirect(`/receipt/${sessionId}/slip`);
  }

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
