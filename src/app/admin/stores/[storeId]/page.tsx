import { notFound } from 'next/navigation';
import { StoreMenuManager } from '@/features/admin-store/store-menu-manager';
import { getRepositories } from '@/server/container';

export const dynamic = 'force-dynamic';

export default async function AdminStoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { storeRepo } = getRepositories();
  const catalog = await storeRepo.findStoreCatalogById(storeId);

  if (!catalog) {
    notFound();
  }

  return <StoreMenuManager initialCatalog={catalog} />;
}
