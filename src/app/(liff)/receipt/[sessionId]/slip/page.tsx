import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceiptSlipClient } from '@/features/receipt/receipt-slip-client';
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

    const title = `สลิปใบเสร็จ ${storeName} #${shortId}`;
    const description = `สรุปบิล ${storeName} (${totalCount} จาน • ${priceText}) ดูรายการอาหารและยอดแยกรายคน`;

    return constructMetadata({
      title,
      description,
      canonicalUrl: `/receipt/${sessionId}/slip`,
      noIndex: true,
    });
  } catch {
    return constructMetadata({
      title: `สลิปใบเสร็จ #${shortId}`,
      description: 'ดูสรุปยอดคำสั่งซื้อและยอดแยกรายคน',
      canonicalUrl: `/receipt/${sessionId}/slip`,
      noIndex: true,
    });
  }
}

export default async function ReceiptSlipPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const service = getOrderSessionService();

  try {
    const { session, summary } = await service.getSessionDetail(sessionId);
    return <ReceiptSlipClient session={session} summary={summary} />;
  } catch (error) {
    if (error instanceof DomainError && error.code === 'RESOURCE_NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
