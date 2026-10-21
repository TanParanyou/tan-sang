import { StoreListManager } from '@/features/admin-store/store-list-manager';
import { getRepositories } from '@/server/container';

export const dynamic = 'force-dynamic';

export default async function AdminStoresPage() {
  const { storeRepo } = getRepositories();
  const stores = await storeRepo.findAllStores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">จัดการร้านอาหาร (Stores)</h1>
        <p className="mt-0.5 text-xs text-ink-secondary">
          เพิ่มร้านอาหารใหม่ หรือเลือกร้านเพื่อตั้งค่าเมนู ขนาดราคา ท็อปปิ้ง และสถานะเมนูงดสั่ง
        </p>
      </div>

      <StoreListManager initialStores={stores} />
    </div>
  );
}
