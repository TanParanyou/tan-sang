'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Edit2,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';
import type {
  MenuOption,
  MenuStatus,
  StoreCatalogAggregate,
  StoreMenu,
} from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { Button, ConfirmDialog } from '@/components/ui';

export function StoreMenuManager({
  initialCatalog,
}: {
  initialCatalog: StoreCatalogAggregate;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<StoreCatalogAggregate>(initialCatalog);

  // Store header edit state
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editStoreNameTh, setEditStoreNameTh] = useState('');
  const [editStoreNameEn, setEditStoreNameEn] = useState('');
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Add menu state
  const [menuTh, setMenuTh] = useState('');
  const [menuEn, setMenuEn] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [specialPrice, setSpecialPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMenuError, setCreateMenuError] = useState<string | null>(null);

  // Edit menu state
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuTh, setEditMenuTh] = useState('');
  const [editMenuEn, setEditMenuEn] = useState('');
  const [editMenuVariants, setEditMenuVariants] = useState<
    Array<{
      id?: string;
      nameTh: string;
      nameEn?: string;
      price: number | string;
      isDefault: boolean;
    }>
  >([]);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [editMenuError, setEditMenuError] = useState<string | null>(null);

  // Add topping state
  const [optionTh, setOptionTh] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [isSubmittingOption, setIsSubmittingOption] = useState(false);

  // Edit topping state
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionTh, setEditOptionTh] = useState('');
  const [editOptionPrice, setEditOptionPrice] = useState('');
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [editOptionError, setEditOptionError] = useState<string | null>(null);

  // Store header actions
  const startEditStore = () => {
    setIsEditingStore(true);
    setEditStoreNameTh(getLocalizedText(catalog.store.name, 'th'));
    setEditStoreNameEn(catalog.store.name.en ?? '');
  };

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

  const handleUpdateStoreName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStoreNameTh.trim()) return;

    setIsSavingStore(true);
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STORE',
          payload: {
            id: catalog.store.id,
            name: {
              th: editStoreNameTh.trim(),
              en: editStoreNameEn.trim() || undefined,
            },
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: StoreCatalogAggregate['store'];
        error?: { message: string };
      };
      if (json.ok && json.data) {
        setCatalog((prev) => ({
          ...prev,
          store: json.data!,
        }));
        setIsEditingStore(false);
        router.refresh();
      } else {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถแก้ไขชื่อร้านได้');
      }
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleToggleStoreActive = async () => {
    const nextActive = !catalog.store.isActive;
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STORE',
          payload: {
            id: catalog.store.id,
            isActive: nextActive,
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: StoreCatalogAggregate['store'];
        error?: { message: string };
      };
      if (json.ok && json.data) {
        setCatalog((prev) => ({
          ...prev,
          store: json.data!,
        }));
        router.refresh();
      } else {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถเปลี่ยนสถานะร้านได้');
      }
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const performDeleteThisStore = async () => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_STORE',
          payload: { storeId: catalog.store.id },
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถลบร้านค้าได้');
        return;
      }

      router.push('/admin/stores');
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeleteThisStore = () => {
    const storeTitle = getLocalizedText(catalog.store.name, 'th');
    setDialogState({
      isOpen: true,
      title: `ลบร้าน "${storeTitle}"`,
      description: `คุณต้องการลบร้าน "${storeTitle}" (${catalog.store.id}) ใช่หรือไม่?\n\nคำเตือน: ข้อมูลเมนูอาหารและท็อปปิ้งทั้งหมดของร้านนี้จะถูกลบถาวร`,
      type: 'confirm',
      variant: 'danger',
      confirmText: 'ลบร้านค้า',
      onConfirm: async () => {
        closeDialog();
        await performDeleteThisStore();
      },
    });
  };

  // Menu status change
  const handleStatusChange = async (menuId: string, status: MenuStatus) => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MENU_STATUS',
          payload: { menuId, status },
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถเปลี่ยนสถานะเมนูได้');
        return;
      }

      setCatalog((prev) => ({
        ...prev,
        menus: prev.menus.map((m) => (m.id === menuId ? { ...m, status } : m)),
      }));
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Create menu
  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuTh.trim()) return;
    setIsSubmitting(true);
    setCreateMenuError(null);

    try {
      const parsedReg = regPrice.trim() === '' ? 0 : Number(regPrice);
      const parsedSpecial = specialPrice.trim() === '' ? null : Number(specialPrice);

      const variants = [
        {
          name: { th: 'ธรรมดา', en: 'Regular' },
          price: Number.isFinite(parsedReg) && parsedReg >= 0 ? parsedReg : 0,
          isDefault: true,
        },
      ];

      if (parsedSpecial !== null && Number.isFinite(parsedSpecial) && parsedSpecial > 0) {
        variants.push({
          name: { th: 'พิเศษ', en: 'Large' },
          price: parsedSpecial,
          isDefault: false,
        });
      }

      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_MENU',
          payload: {
            storeId: catalog.store.id,
            name: {
              th: menuTh.trim(),
              en: menuEn.trim() || undefined,
            },
            status: 'ACTIVE',
            variants,
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: StoreCatalogAggregate['menus'][number];
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setCreateMenuError(json.error?.message ?? 'ไม่สามารถเพิ่มเมนูได้');
        return;
      }

      const created = json.data;
      setCatalog((prev) => ({
        ...prev,
        menus: [...prev.menus, created],
      }));
      setMenuTh('');
      setMenuEn('');
      setRegPrice('');
      setSpecialPrice('');
      router.refresh();
    } catch {
      setCreateMenuError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit menu
  const startEditMenu = (menu: StoreMenu) => {
    setEditingMenuId(menu.id);
    setEditMenuTh(getLocalizedText(menu.name, 'th'));
    setEditMenuEn(menu.name.en ?? '');
    setEditMenuVariants(
      menu.variants.length > 0
        ? menu.variants.map((v) => ({
            id: v.id,
            nameTh: getLocalizedText(v.name, 'th'),
            nameEn: v.name.en,
            price: v.price,
            isDefault: v.isDefault,
          }))
        : [
            { nameTh: 'ธรรมดา', nameEn: 'Regular', price: 0, isDefault: true },
          ],
    );
    setEditMenuError(null);
  };

  const cancelEditMenu = () => {
    setEditingMenuId(null);
    setEditMenuTh('');
    setEditMenuEn('');
    setEditMenuVariants([]);
    setEditMenuError(null);
  };

  const addVariantToEdit = () => {
    setEditMenuVariants((prev) => [
      ...prev,
      {
        nameTh: prev.length === 1 ? 'พิเศษ' : `ขนาด ${prev.length + 1}`,
        nameEn: prev.length === 1 ? 'Large' : undefined,
        price: '',
        isDefault: false,
      },
    ]);
  };

  const removeVariantFromEdit = (idxToRemove: number) => {
    if (editMenuVariants.length <= 1) {
      showAlert('แจ้งเตือน', 'เมนูต้องมีราคาอย่างน้อย 1 ขนาด');
      return;
    }
    setEditMenuVariants((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuId || !editMenuTh.trim()) return;

    if (editMenuVariants.length === 0) {
      setEditMenuError('ต้องระบุราคาอย่างน้อย 1 ขนาด');
      return;
    }

    setIsSavingMenu(true);
    setEditMenuError(null);

    try {
      const payload = {
        menuId: editingMenuId,
        name: {
          th: editMenuTh.trim(),
          en: editMenuEn.trim() || undefined,
        },
        variants: editMenuVariants.map((v, index) => ({
          id: v.id,
          name: {
            th: v.nameTh.trim() || `ขนาด ${index + 1}`,
            en: v.nameEn?.trim() || undefined,
          },
          price: Number.isFinite(Number(v.price)) && Number(v.price) >= 0 ? Number(v.price) : 0,
          isDefault: index === 0,
        })),
      };

      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MENU',
          payload,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: StoreMenu;
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setEditMenuError(json.error?.message ?? 'ไม่สามารถแก้ไขเมนูได้');
        return;
      }

      const updated = json.data;
      setCatalog((prev) => ({
        ...prev,
        menus: prev.menus.map((m) => (m.id === updated.id ? updated : m)),
      }));
      cancelEditMenu();
      router.refresh();
    } catch {
      setEditMenuError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Delete menu
  const performDeleteMenu = async (menuId: string) => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_MENU',
          payload: { menuId },
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถลบเมนูได้');
        return;
      }

      setCatalog((prev) => ({
        ...prev,
        menus: prev.menus.filter((m) => m.id !== menuId),
      }));
      if (editingMenuId === menuId) {
        cancelEditMenu();
      }
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeleteMenu = (menuId: string, menuTitle: string) => {
    setDialogState({
      isOpen: true,
      title: `ลบเมนู "${menuTitle}"`,
      description: `คุณต้องการลบเมนู "${menuTitle}" ใช่หรือไม่?`,
      type: 'confirm',
      variant: 'danger',
      confirmText: 'ลบเมนู',
      onConfirm: async () => {
        closeDialog();
        await performDeleteMenu(menuId);
      },
    });
  };

  // Add topping
  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionTh.trim()) return;
    setIsSubmittingOption(true);

    try {
      const parsedOption = optionPrice.trim() === '' ? 0 : Number(optionPrice);

      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_OPTION',
          payload: {
            storeId: catalog.store.id,
            menuId: null,
            name: { th: optionTh.trim() },
            price: Number.isFinite(parsedOption) && parsedOption >= 0 ? parsedOption : 0,
            isAvailable: true,
          },
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: MenuOption;
        error?: { message: string };
      };
      if (json.ok && json.data) {
        const created = json.data;
        setCatalog((prev) => ({
          ...prev,
          storeWideOptions: [...prev.storeWideOptions, created],
        }));
        setOptionTh('');
        setOptionPrice('');
        router.refresh();
      } else {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถเพิ่มท็อปปิ้งได้');
      }
    } finally {
      setIsSubmittingOption(false);
    }
  };

  // Edit topping
  const startEditOption = (opt: MenuOption) => {
    setEditingOptionId(opt.id);
    setEditOptionTh(getLocalizedText(opt.name, 'th'));
    setEditOptionPrice(String(opt.price));
    setEditOptionError(null);
  };

  const cancelEditOption = () => {
    setEditingOptionId(null);
    setEditOptionTh('');
    setEditOptionPrice('');
    setEditOptionError(null);
  };

  const handleUpdateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOptionId || !editOptionTh.trim()) return;

    setIsSavingOption(true);
    setEditOptionError(null);

    try {
      const parsedOption = editOptionPrice.trim() === '' ? 0 : Number(editOptionPrice);

      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_OPTION',
          payload: {
            optionId: editingOptionId,
            name: { th: editOptionTh.trim() },
            price: Number.isFinite(parsedOption) && parsedOption >= 0 ? parsedOption : 0,
          },
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: MenuOption;
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setEditOptionError(json.error?.message ?? 'ไม่สามารถแก้ไขท็อปปิ้งได้');
        return;
      }

      const updated = json.data;
      setCatalog((prev) => ({
        ...prev,
        storeWideOptions: prev.storeWideOptions.map((o) => (o.id === updated.id ? updated : o)),
      }));
      cancelEditOption();
      router.refresh();
    } catch {
      setEditOptionError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSavingOption(false);
    }
  };

  // Delete topping
  const performDeleteOption = async (optionId: string) => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_OPTION',
          payload: { optionId },
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        showAlert('ข้อผิดพลาด', json.error?.message ?? 'ไม่สามารถลบท็อปปิ้งได้');
        return;
      }

      setCatalog((prev) => ({
        ...prev,
        storeWideOptions: prev.storeWideOptions.filter((o) => o.id !== optionId),
      }));
      if (editingOptionId === optionId) {
        cancelEditOption();
      }
      router.refresh();
    } catch {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeleteOption = (optionId: string, optionTitle?: string) => {
    const title = optionTitle || 'ท็อปปิ้งนี้';
    setDialogState({
      isOpen: true,
      title: `ลบท็อปปิ้ง "${title}"`,
      description: `คุณต้องการลบท็อปปิ้ง "${title}" ใช่หรือไม่?`,
      type: 'confirm',
      variant: 'danger',
      confirmText: 'ลบท็อปปิ้ง',
      onConfirm: async () => {
        closeDialog();
        await performDeleteOption(optionId);
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Link
          href="/admin/stores"
          className="mb-3 inline-flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>กลับหน้ารายชื่อร้านค้า</span>
        </Link>

        {isEditingStore ? (
          <form
            onSubmit={handleUpdateStoreName}
            className="mt-2 rounded-theme border border-hairline bg-surface p-4 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-chili">{catalog.store.id}</span>
              <span className="text-xs font-semibold text-ink">แก้ไขชื่อร้านค้า</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                required
                value={editStoreNameTh}
                onChange={(e) => setEditStoreNameTh(e.target.value)}
                placeholder="ชื่อร้าน (ภาษาไทย) *"
                className="min-h-[38px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
              />
              <input
                type="text"
                value={editStoreNameEn}
                onChange={(e) => setEditStoreNameEn(e.target.value)}
                placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
                className="min-h-[38px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  loading={isSavingStore}
                  disabled={isSavingStore}
                  className="bg-chili text-white hover:bg-chili-hover border-chili"
                >
                  <Check className="h-3.5 w-3.5" />
                  บันทึก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditingStore(false)}
                  disabled={isSavingStore}
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
                <span className="font-mono text-xs font-bold text-chili">{catalog.store.id}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                    catalog.store.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-subtle text-ink-secondary border border-hairline'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      catalog.store.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                  {catalog.store.isActive ? 'เปิดใช้งาน' : 'ปิดชั่วคราว'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink">
                  {getLocalizedText(catalog.store.name, 'th')}
                  {catalog.store.name.en && (
                    <span className="ml-2 text-sm font-normal text-ink-muted">
                      ({catalog.store.name.en})
                    </span>
                  )}
                </h1>
                <button
                  type="button"
                  onClick={startEditStore}
                  title="แก้ไขชื่อร้าน"
                  aria-label="แก้ไขชื่อร้าน"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-theme text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-secondary">
                จัดการรายการอาหาร ราคาธรรมดา/พิเศษ ท็อปปิ้งประจำร้าน และสถานะการขายของแต่ละเมนู
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStoreActive}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border px-3.5 py-1.5 text-xs font-medium transition ${
                  catalog.store.isActive
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{catalog.store.isActive ? 'ปิดรับออเดอร์ร้านนี้' : 'เปิดรับออเดอร์ร้านนี้'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteThisStore}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="ลบร้านค้านี้"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ลบร้านนี้</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Add New Menu Form */}
      <form
        onSubmit={handleCreateMenu}
        className="rounded-theme border border-hairline bg-surface p-5 shadow-xs"
      >
        <h2 className="text-sm font-semibold text-ink">1. เพิ่มเมนูอาหารใหม่</h2>
        {createMenuError && (
          <p className="mt-2 text-xs font-medium text-red-600">{createMenuError}</p>
        )}
        <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-4">
          <input
            type="text"
            required
            value={menuTh}
            onChange={(e) => setMenuTh(e.target.value)}
            placeholder="ชื่อเมนู (ภาษาไทย) *"
            className="h-[44px] min-h-[44px] rounded-theme border border-hairline bg-canvas px-3.5 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="text"
            value={menuEn}
            onChange={(e) => setMenuEn(e.target.value)}
            placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
            className="h-[44px] min-h-[44px] rounded-theme border border-hairline bg-canvas px-3.5 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={regPrice}
            onChange={(e) => setRegPrice(e.target.value)}
            placeholder="ราคาธรรมดา *"
            className="h-[44px] min-h-[44px] rounded-theme border border-hairline bg-canvas px-3.5 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={specialPrice}
              onChange={(e) => setSpecialPrice(e.target.value)}
              placeholder="ราคาพิเศษ (เว้นว่างได้)"
              className="h-[44px] min-h-[44px] w-full rounded-theme border border-hairline bg-canvas px-3.5 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              size="md"
              className="h-[44px] min-h-[44px] shrink-0 bg-chili text-white hover:bg-chili-hover border-chili px-4"
            >
              <Plus className="h-4 w-4" />
              เพิ่มเมนู
            </Button>
          </div>
        </div>
      </form>

      {/* 2. Store-Wide Add-ons Section */}
      <div className="rounded-theme border border-hairline bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            2. ท็อปปิ้งประจำร้าน ({catalog.storeWideOptions.length} รายการ)
          </h2>
          <span className="text-xs text-ink-muted hidden sm:inline">
            ท็อปปิ้งที่ลูกค้าสามารถเลือกเพิ่มได้กับทุกเมนู
          </span>
        </div>

        {/* Existing toppings */}
        <div className="mt-3 flex flex-wrap gap-2.5">
          {catalog.storeWideOptions.length === 0 ? (
            <p className="text-xs text-ink-muted py-2">
              ยังไม่มีท็อปปิ้งประจำร้าน สามารถเพิ่มได้ที่แบบฟอร์มด้านล่าง
            </p>
          ) : (
            catalog.storeWideOptions.map((opt) => {
              const isEditingThisOption = editingOptionId === opt.id;
              const optTitle = getLocalizedText(opt.name, 'th');

              if (isEditingThisOption) {
                return (
                  <form
                    key={opt.id}
                    onSubmit={handleUpdateOption}
                    className="flex flex-wrap items-center gap-2 rounded-theme border-2 border-chili bg-canvas p-2 shadow-xs"
                  >
                    <input
                      type="text"
                      required
                      value={editOptionTh}
                      onChange={(e) => setEditOptionTh(e.target.value)}
                      placeholder="ชื่อท็อปปิ้ง *"
                      className="h-8 min-w-[120px] rounded border border-hairline bg-surface px-2.5 text-xs font-medium text-ink focus:border-chili focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        required
                        value={editOptionPrice}
                        onChange={(e) => setEditOptionPrice(e.target.value)}
                        placeholder="ราคา"
                        className="h-8 w-20 rounded border border-hairline bg-surface px-2 font-mono text-xs text-ink tabular-nums focus:border-chili focus:outline-none"
                      />
                      <span className="text-xs text-ink-secondary">฿</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingOption}
                      className="inline-flex h-8 items-center gap-1 rounded bg-chili px-2.5 text-xs font-semibold text-white hover:bg-chili-hover transition-colors shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>บันทึก</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditOption}
                      className="inline-flex h-8 items-center rounded border border-hairline bg-surface px-2 text-xs text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>ยกเลิก</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id, optTitle)}
                      className="inline-flex h-8 items-center gap-1 rounded border border-red-200 bg-red-50 px-2 text-xs text-red-600 hover:bg-red-100 transition-colors"
                      title="ลบท็อปปิ้งนี้"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบ</span>
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={opt.id}
                  className="inline-flex items-center gap-2 rounded-theme border border-hairline bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:border-hairline shadow-2xs"
                >
                  <span className="font-semibold text-ink">{optTitle}</span>
                  <span className="font-mono font-bold text-chili tabular-nums">+{opt.price}฿</span>

                  <div className="flex items-center gap-1 border-l border-hairline pl-2 ml-1">
                    {/* Edit Option button */}
                    <button
                      type="button"
                      onClick={() => startEditOption(opt)}
                      aria-label={`แก้ไขท็อปปิ้ง ${optTitle}`}
                      title="แก้ไขท็อปปิ้ง"
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete Option button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id, optTitle)}
                      aria-label={`ลบท็อปปิ้ง ${optTitle}`}
                      title="ลบท็อปปิ้ง"
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {editOptionError && (
          <p className="mt-2 text-xs font-medium text-red-600">{editOptionError}</p>
        )}

        {/* Add topping form */}
        <form onSubmit={handleCreateOption} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            required
            value={optionTh}
            onChange={(e) => setOptionTh(e.target.value)}
            placeholder="ชื่อท็อปปิ้งใหม่ เช่น ไข่เค็ม, หมูยอทอด *"
            className="h-[44px] min-h-[44px] flex-1 rounded-theme border border-hairline bg-canvas px-3.5 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={optionPrice}
            onChange={(e) => setOptionPrice(e.target.value)}
            placeholder="ราคา (ค่าเริ่มต้น 0)"
            className="h-[44px] min-h-[44px] w-36 rounded-theme border border-hairline bg-canvas px-3.5 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
          />
          <Button
            type="submit"
            disabled={isSubmittingOption}
            loading={isSubmittingOption}
            size="md"
            variant="secondary"
            className="h-[44px] min-h-[44px] px-4"
          >
            <Plus className="h-4 w-4" />
            เพิ่มท็อปปิ้ง
          </Button>
        </form>
      </div>

      {/* 3. Menu List */}
      <div className="overflow-hidden rounded-theme border border-hairline bg-surface shadow-xs">
        <div className="border-b border-hairline bg-canvas/50 px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">
            รายการอาหารทั้งหมด ({catalog.menus.length} รายการ)
          </h2>
        </div>

        <div className="divide-y divide-hairline">
          {catalog.menus.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-muted">
              ยังไม่มีเมนูอาหารในร้านนี้ กรุณาเพิ่มเมนูในแบบฟอร์มด้านบน
            </div>
          ) : (
            catalog.menus.map((menu) => {
              const isEditingThisMenu = editingMenuId === menu.id;

              return (
                <div key={menu.id} className="p-5 transition-colors hover:bg-canvas/30">
                  {isEditingThisMenu ? (
                    <form onSubmit={handleUpdateMenu} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">แก้ไขข้อมูลเมนู</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            loading={isSavingMenu}
                            disabled={isSavingMenu}
                            className="bg-chili text-white hover:bg-chili-hover border-chili"
                          >
                            <Check className="h-3.5 w-3.5" />
                            บันทึกเมนู
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={cancelEditMenu}
                            disabled={isSavingMenu}
                          >
                            <X className="h-3.5 w-3.5" />
                            ยกเลิก
                          </Button>
                        </div>
                      </div>

                      {editMenuError && (
                        <p className="text-xs font-medium text-red-600">{editMenuError}</p>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            ชื่อเมนูภาษาไทย *
                          </label>
                          <input
                            type="text"
                            required
                            value={editMenuTh}
                            onChange={(e) => setEditMenuTh(e.target.value)}
                            className="w-full min-h-[38px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">
                            ชื่อเมนูภาษาอังกฤษ
                          </label>
                          <input
                            type="text"
                            value={editMenuEn}
                            onChange={(e) => setEditMenuEn(e.target.value)}
                            className="w-full min-h-[38px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Edit Variants */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-ink-secondary">
                            ราคาและขนาด (Variants)
                          </label>
                          <button
                            type="button"
                            onClick={addVariantToEdit}
                            className="inline-flex items-center gap-1 text-xs font-medium text-chili hover:underline"
                          >
                            <Plus className="h-3 w-3" />
                            เพิ่มขนาด/ราคา
                          </button>
                        </div>

                        <div className="space-y-2">
                          {editMenuVariants.map((v, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-theme border border-hairline bg-canvas p-2.5"
                            >
                              <input
                                type="text"
                                required
                                value={v.nameTh}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditMenuVariants((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, nameTh: val } : item,
                                    ),
                                  );
                                }}
                                placeholder="ชื่อขนาด เช่น ธรรมดา, พิเศษ"
                                className="w-32 min-h-[34px] rounded border border-hairline bg-surface px-2.5 text-xs font-medium text-ink focus:border-chili focus:outline-none"
                              />
                              <div className="flex flex-1 items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  required
                                  value={v.price}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditMenuVariants((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, price: val } : item,
                                      ),
                                    );
                                  }}
                                  placeholder="ราคา"
                                  className="w-full min-h-[34px] rounded border border-hairline bg-surface px-2.5 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
                                />
                                <span className="text-xs text-ink-secondary font-mono">฿</span>
                              </div>
                              {editMenuVariants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeVariantFromEdit(idx)}
                                  title="ลบขนาดนี้"
                                  aria-label="ลบขนาดนี้"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-ink-muted hover:bg-subtle hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-ink">
                            {getLocalizedText(menu.name, 'th')}
                            {menu.name.en && (
                              <span className="ml-1 text-xs font-normal text-ink-muted">
                                ({menu.name.en})
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-ink-secondary tabular-nums">
                          {menu.variants.length > 0
                            ? menu.variants
                                .map((v) => `${getLocalizedText(v.name, 'th')} ${v.price}฿`)
                                .join(' / ')
                            : 'ยังไม่ได้ระบุราคา'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status switcher */}
                        <div className="inline-flex rounded-lg bg-subtle p-1 text-xs">
                          {(['ACTIVE', 'OUT_OF_STOCK', 'BANNED'] as const).map((status) => {
                            const active = menu.status === status;
                            const label =
                              status === 'ACTIVE'
                                ? 'ขายปกติ'
                                : status === 'OUT_OF_STOCK'
                                  ? 'ของหมด'
                                  : 'งดสั่ง';
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(menu.id, status)}
                                className={`rounded-md px-2.5 py-1 font-medium transition ${
                                  active
                                    ? 'bg-surface text-ink shadow-sm'
                                    : 'text-ink-secondary hover:text-ink'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Edit menu button */}
                        <button
                          type="button"
                          onClick={() => startEditMenu(menu)}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-theme border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink transition hover:bg-subtle"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-ink-muted" />
                          <span>แก้ไข</span>
                        </button>

                        {/* Delete menu button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMenu(menu.id, getLocalizedText(menu.name, 'th'))
                          }
                          aria-label={`ลบเมนู ${getLocalizedText(menu.name, 'th')}`}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-theme border border-hairline bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">ลบเมนู</span>
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
