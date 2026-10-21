'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Store } from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';

export function StoreListManager({ initialStores }: { initialStores: Store[] }) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [storeId, setStoreId] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_STORE',
          payload: {
            id: storeId.trim().toUpperCase(),
            name: {
              th: nameTh.trim(),
              en: nameEn.trim() || undefined,
            },
            isActive: true,
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: Store;
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setErrorMsg(json.error?.message ?? 'ไม่สามารถสร้างร้านค้าได้');
        return;
      }

      const created = json.data;
      setStores((prev) => {
        const filtered = prev.filter((s) => s.id !== created.id);
        return [...filtered, created];
      });
      setStoreId('');
      setNameTh('');
      setNameEn('');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Store Form */}
      <form
        onSubmit={handleCreateStore}
        className="rounded-xl border border-hairline bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-ink">เพิ่มร้านอาหารใหม่</h2>
        {errorMsg && (
          <p className="mt-2 text-xs font-medium text-red-600">{errorMsg}</p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="text"
            required
            value={storeId}
            onChange={(e) => setStoreId(e.target.value.toUpperCase())}
            placeholder="รหัสร้าน (เช่น STORE02) *"
            className="min-h-[42px] rounded-lg border border-hairline bg-canvas px-3 font-mono text-sm uppercase text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="text"
            required
            value={nameTh}
            onChange={(e) => setNameTh(e.target.value)}
            placeholder="ชื่อร้านภาษาไทย *"
            className="min-h-[42px] rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
            className="min-h-[42px] rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-chili px-4 text-xs font-semibold text-white hover:bg-chili-hover"
          >
            <Plus className="h-4 w-4" />
            บันทึกร้านค้า
          </button>
        </div>
      </form>

      {/* Store List */}
      <div className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface">
        {stores.map((store) => (
          <div
            key={store.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-chili">{store.id}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    store.isActive
                      ? 'bg-line-subtle text-line'
                      : 'bg-subtle text-ink-secondary'
                  }`}
                >
                  {store.isActive ? 'เปิดใช้งาน' : 'ปิดชั่วคราว'}
                </span>
              </div>
              <p className="mt-1 text-base font-medium text-ink">
                {getLocalizedText(store.name, 'th')}
                {store.name.en ? ` (${store.name.en})` : ''}
              </p>
            </div>

            <Link
              href={`/admin/stores/${store.id}`}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-hairline bg-canvas px-4 py-2 text-xs font-semibold text-ink transition hover:bg-subtle"
            >
              จัดการเมนูและราคา →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
