'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Edit2, Plus, Power, Shuffle, Trash2, X } from 'lucide-react';
import type { Store } from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { Button, Checkbox, ConfirmDialog } from '@/components/ui';

function generateRandomStoreId(existingStores: Store[]): string {
  const existingIds = new Set(existingStores.map((s) => s.id));

  // Check sequential STORE01, STORE02...
  let maxSeq = 0;
  for (const s of existingStores) {
    const match = s.id.match(/^STORE(\d+)$/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }

  const nextSeqId = `STORE${String(maxSeq + 1).padStart(2, '0')}`;
  if (!existingIds.has(nextSeqId)) {
    return nextSeqId;
  }

  // Fallback to random alphanumeric suffix
  for (let i = 0; i < 30; i++) {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const candidate = `STORE-${rand}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `STORE-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

export function StoreListManager({ initialStores }: { initialStores: Store[] }) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(initialStores);

  // Create store form state with auto-generated random/sequential ID
  const [storeId, setStoreId] = useState(() => generateRandomStoreId(initialStores));
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit store inline state
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editNameTh, setEditNameTh] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Reusable in-app confirm & alert modal dialog
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type?: 'confirm' | 'alert';
    variant?: 'danger' | 'primary';
    onConfirm?: () => Promise<void> | void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const closeDialog = () => setDialogState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (title: string, description: string) => {
    setDialogState({
      isOpen: true,
      title,
      description,
      type: 'alert',
      variant: 'primary',
      confirmText: 'ตกลง',
    });
  };

  const startEdit = (store: Store) => {
    setEditingStoreId(store.id);
    setEditNameTh(getLocalizedText(store.name, 'th'));
    setEditNameEn(store.name.en ?? '');
    setEditErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingStoreId(null);
    setEditNameTh('');
    setEditNameEn('');
    setEditErrorMsg(null);
  };

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
            isActive,
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
      const nextStores = [...stores.filter((s) => s.id !== created.id), created];
      setStores(nextStores);
      setStoreId(generateRandomStoreId(nextStores));
      setNameTh('');
      setNameEn('');
      setIsActive(true);
      router.refresh();
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreId || !editNameTh.trim()) return;

    setIsUpdating(true);
    setEditErrorMsg(null);

    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STORE',
          payload: {
            id: editingStoreId,
            name: {
              th: editNameTh.trim(),
              en: editNameEn.trim() || undefined,
            },
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: Store;
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setEditErrorMsg(json.error?.message ?? 'ไม่สามารถแก้ไขร้านค้าได้');
        return;
      }

      const updated = json.data;
      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      cancelEdit();
      router.refresh();
    } catch {
      setEditErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (store: Store) => {
    const nextActive = !store.isActive;
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STORE',
          payload: {
            id: store.id,
            isActive: nextActive,
          },
        }),
      });

      const json = (await res.json()) as { ok: boolean; data?: Store; error?: { message: string } };
      if (!json.ok || !json.data) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถเปลี่ยนสถานะร้านได้');
        return;
      }
      const updated = json.data;
      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const performDeleteStore = async (store: Store) => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_STORE',
          payload: { storeId: store.id },
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถลบร้านค้าได้');
        return;
      }

      setStores((prev) => prev.filter((s) => s.id !== store.id));
      if (editingStoreId === store.id) {
        cancelEdit();
      }
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeleteStore = (store: Store) => {
    const storeTitle = getLocalizedText(store.name, 'th');
    setDialogState({
      isOpen: true,
      title: `ลบร้าน "${storeTitle}"`,
      description: `คุณต้องการลบร้าน "${storeTitle}" (${store.id}) ใช่หรือไม่?\n\nคำเตือน: เมนูอาหารและตัวเลือกทั้งหมดของร้านนี้จะถูกลบถาวร`,
      type: 'confirm',
      variant: 'danger',
      confirmText: 'ลบร้านค้า',
      onConfirm: async () => {
        closeDialog();
        await performDeleteStore(store);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Store Form */}
      <form
        onSubmit={handleCreateStore}
        className="rounded-theme border border-hairline bg-surface p-5 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">เพิ่มร้านอาหารใหม่</h2>
          <span className="text-[11px] text-ink-muted">รหัสร้านถูกสุ่มให้อัตโนมัติ สามารถแก้ไขได้</span>
        </div>

        {errorMsg && (
          <p className="mt-2 text-xs font-medium text-red-600">{errorMsg}</p>
        )}

        <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-5">
          {/* Store ID with Randomize button */}
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={storeId}
              onChange={(e) => setStoreId(e.target.value.toUpperCase())}
              placeholder="รหัสร้าน *"
              className="h-[44px] min-h-[44px] w-full rounded-theme border border-hairline bg-canvas pl-3.5 pr-10 font-mono text-sm uppercase text-ink focus:border-chili focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setStoreId(generateRandomStoreId(stores))}
              title="สุ่มรหัสร้านใหม่"
              aria-label="สุ่มรหัสร้านใหม่"
              className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded text-ink-muted transition-colors hover:bg-subtle hover:text-chili"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            required
            value={nameTh}
            onChange={(e) => setNameTh(e.target.value)}
            placeholder="ชื่อร้านภาษาไทย *"
            className="h-[44px] min-h-[44px] rounded-theme border border-hairline bg-canvas px-3.5 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
            className="h-[44px] min-h-[44px] rounded-theme border border-hairline bg-canvas px-3.5 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <div className="flex h-[44px] min-h-[44px] items-center px-1">
            <Checkbox
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              label="เปิดใช้งานทันที"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            size="md"
            className="h-[44px] min-h-[44px] bg-chili text-white hover:bg-chili-hover border-chili"
          >
            <Plus className="h-4 w-4" />
            บันทึกร้านค้า
          </Button>
        </div>
      </form>

      {/* Store List */}
      <div className="overflow-hidden rounded-theme border border-hairline bg-surface shadow-xs">
        <div className="border-b border-hairline bg-canvas/50 px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">
            รายชื่อร้านอาหารทั้งหมด ({stores.length} ร้าน)
          </h2>
        </div>

        <div className="divide-y divide-hairline">
          {stores.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-muted">
              ยังไม่มีร้านอาหารในระบบ กรุณาเพิ่มร้านอาหารด้านบน
            </div>
          ) : (
            stores.map((store) => {
              const isEditing = editingStoreId === store.id;

              return (
                <div
                  key={store.id}
                  className="p-5 transition-colors hover:bg-canvas/30"
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdateStore} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-chili">{store.id}</span>
                        <span className="text-xs font-semibold text-ink">แก้ไขชื่อร้านค้า</span>
                      </div>
                      {editErrorMsg && (
                        <p className="text-xs font-medium text-red-600">{editErrorMsg}</p>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          type="text"
                          required
                          value={editNameTh}
                          onChange={(e) => setEditNameTh(e.target.value)}
                          placeholder="ชื่อร้านภาษาไทย *"
                          className="h-[40px] min-h-[40px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
                          className="h-[40px] min-h-[40px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            loading={isUpdating}
                            disabled={isUpdating}
                            className="h-[40px] min-h-[40px] bg-chili text-white hover:bg-chili-hover border-chili px-4"
                          >
                            <Check className="h-3.5 w-3.5" />
                            บันทึก
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={cancelEdit}
                            disabled={isUpdating}
                            className="h-[40px] min-h-[40px] px-4"
                          >
                            <X className="h-3.5 w-3.5" />
                            ยกเลิก
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-chili">{store.id}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                              store.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-subtle text-ink-secondary border border-hairline'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                store.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                              }`}
                            />
                            {store.isActive ? 'เปิดใช้งาน' : 'ปิดชั่วคราว'}
                          </span>
                        </div>
                        <p className="mt-1 text-base font-semibold text-ink">
                          {getLocalizedText(store.name, 'th')}
                          {store.name.en ? (
                            <span className="ml-1 text-xs font-normal text-ink-muted">
                              ({store.name.en})
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Toggle Active status */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(store)}
                          title={store.isActive ? 'คลิกเพื่อปิดร้าน' : 'คลิกเพื่อเปิดร้าน'}
                          className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-theme border px-3 py-1 text-xs font-medium transition ${
                            store.isActive
                              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{store.isActive ? 'ปิดร้าน' : 'เปิดร้าน'}</span>
                        </button>

                        {/* Edit Store button */}
                        <button
                          type="button"
                          onClick={() => startEdit(store)}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-theme border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink transition hover:bg-subtle"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-ink-muted" />
                          <span>แก้ไขชื่อ</span>
                        </button>

                        {/* Manage menu link */}
                        <Link
                          href={`/admin/stores/${store.id}`}
                          className="inline-flex min-h-[34px] items-center rounded-theme border border-hairline bg-canvas px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink hover:bg-subtle"
                        >
                          จัดการเมนูและราคา →
                        </Link>

                        {/* Delete Store button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStore(store)}
                          aria-label={`ลบร้าน ${getLocalizedText(store.name, 'th')}`}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-theme border border-hairline bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">ลบร้าน</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        description={dialogState.description}
        type={dialogState.type}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
      />
    </div>
  );
}
