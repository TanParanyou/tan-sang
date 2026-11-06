import { StoreListManager } from '@/features/admin-store/store-list-manager';
import { getRepositories } from '@/server/container';

export const dynamic = 'force-dynamic';

export default async function AdminStoresPage() {
  const { storeRepo } = getRepositories();
  const stores = await storeRepo.findAllStores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Stores Management</h1>
        <p className="mt-0.5 text-xs text-ink-secondary">
          Add new restaurant or select a store to manage dishes, prices, and options.
        </p>
      </div>

      <StoreListManager initialStores={stores} />
    </div>
  );
}
