'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, Plus, Trash2, X } from 'lucide-react';
import type {
  MenuOption,
  MenuStatus,
  StoreCatalogAggregate,
} from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { Button } from '@/components/ui';

export function StoreMenuManager({
  initialCatalog,
}: {
  initialCatalog: StoreCatalogAggregate;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<StoreCatalogAggregate>(initialCatalog);
  const [menuTh, setMenuTh] = useState('');
  const [menuEn, setMenuEn] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [specialPrice, setSpecialPrice] = useState('');

  const [optionTh, setOptionTh] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (menuId: string, status: MenuStatus) => {
    await fetch('/api/v1/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_MENU_STATUS',
        payload: { menuId, status },
      }),
    });

    setCatalog((prev) => ({
      ...prev,
      menus: prev.menus.map((m) => (m.id === menuId ? { ...m, status } : m)),
    }));
    router.refresh();
  };

  const handleVoteBan = async (menuId: string) => {
    const res = await fetch('/api/v1/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'VOTE_BAN_MENU',
        payload: { menuId, autoBanThreshold: 3 },
      }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      data?: { id: string; voteBanCount: number; status: MenuStatus };
    };
    if (json.ok && json.data) {
      const updated = json.data;
      setCatalog((prev) => ({
        ...prev,
        menus: prev.menus.map((m) =>
          m.id === menuId
            ? { ...m, voteBanCount: updated.voteBanCount, status: updated.status }
            : m,
        ),
      }));
      router.refresh();
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!window.confirm('คุณต้องการลบเมนูนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_MENU',
          payload: { menuId },
        }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        setCatalog((prev) => ({
          ...prev,
          menus: prev.menus.filter((m) => m.id !== menuId),
        }));
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      const res = await fetch('/api/v1/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_OPTION',
          payload: { optionId },
        }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        setCatalog((prev) => ({
          ...prev,
          storeWideOptions: prev.storeWideOptions.filter((o) => o.id !== optionId),
        }));
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuTh.trim()) return;
    setIsSubmitting(true);

    try {
      const parsedReg = regPrice.trim() === '' ? 0 : Number(regPrice);
      const parsedSpecial = specialPrice.trim() === '' ? 0 : Number(specialPrice);

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
            variants: [
              {
                name: { th: 'ธรรมดา', en: 'Regular' },
                price: Number.isFinite(parsedReg) && parsedReg >= 0 ? parsedReg : 0,
                isDefault: true,
              },
              {
                name: { th: 'พิเศษ', en: 'Large' },
                price: Number.isFinite(parsedSpecial) && parsedSpecial >= 0 ? parsedSpecial : 0,
                isDefault: false,
              },
            ],
          },
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: StoreCatalogAggregate['menus'][number];
      };
      if (json.ok && json.data) {
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionTh.trim()) return;
    setIsSubmitting(true);

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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>กลับหน้ารายชื่อร้านค้า</span>
        </Link>
        <div>
          <span className="font-mono text-xs font-bold text-chili">{catalog.store.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-ink">
          {getLocalizedText(catalog.store.name, 'th')}
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          จัดการรายการอาหาร ราคาธรรมดา/พิเศษ ท็อปปิ้งประจำร้าน และสถานะการขายของแต่ละเมนู
        </p>
      </div>

      {/* Add New Menu Form */}
      <form
        onSubmit={handleCreateMenu}
        className="rounded-theme border border-hairline bg-surface p-5 shadow-xs"
      >
        <h2 className="text-sm font-semibold text-ink">1. เพิ่มเมนูอาหารใหม่</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="text"
            required
            value={menuTh}
            onChange={(e) => setMenuTh(e.target.value)}
            placeholder="ชื่อเมนู (ภาษาไทย) *"
            className="min-h-[42px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="text"
            value={menuEn}
            onChange={(e) => setMenuEn(e.target.value)}
            placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
            className="min-h-[42px] rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={regPrice}
            onChange={(e) => setRegPrice(e.target.value)}
            placeholder="ราคาธรรมดา (ค่าเริ่มต้น 0)"
            className="min-h-[42px] rounded-theme border border-hairline bg-canvas px-3 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={specialPrice}
              onChange={(e) => setSpecialPrice(e.target.value)}
              placeholder="ราคาพิเศษ (ค่าเริ่มต้น 0)"
              className="min-h-[42px] w-full rounded-theme border border-hairline bg-canvas px-3 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              size="sm"
              className="shrink-0 bg-chili text-white hover:bg-chili-hover border-chili"
            >
              <Plus className="h-4 w-4" />
              เพิ่มเมนู
            </Button>
          </div>
        </div>
      </form>

      {/* Store-Wide Add-ons Section */}
      <form
        onSubmit={handleCreateOption}
        className="rounded-theme border border-hairline bg-surface p-5 shadow-xs"
      >
        <h2 className="text-sm font-semibold text-ink">
          2. ท็อปปิ้งประจำร้าน ({catalog.storeWideOptions.length} รายการ)
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalog.storeWideOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1.5 rounded-theme border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink"
            >
              <span>{getLocalizedText(opt.name, 'th')}</span>
              <strong className="font-mono text-chili tabular-nums">+{opt.price}฿</strong>
              <button
                type="button"
                onClick={() => handleDeleteOption(opt.id)}
                aria-label={`ลบท็อปปิ้ง ${getLocalizedText(opt.name, 'th')}`}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-theme text-ink-muted hover:bg-subtle hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            required
            value={optionTh}
            onChange={(e) => setOptionTh(e.target.value)}
            placeholder="ชื่อท็อปปิ้ง เช่น ไข่เค็ม, หมูยอทอด *"
            className="min-h-[40px] flex-1 rounded-theme border border-hairline bg-canvas px-3 text-sm text-ink focus:border-chili focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={optionPrice}
            onChange={(e) => setOptionPrice(e.target.value)}
            placeholder="ราคา (ค่าเริ่มต้น 0)"
            className="min-h-[40px] w-36 rounded-theme border border-hairline bg-canvas px-3 font-mono text-sm text-ink tabular-nums focus:border-chili focus:outline-none"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            size="sm"
            variant="secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มท็อปปิ้ง
          </Button>
        </div>
      </form>

      {/* Menu List */}
      <div className="divide-y divide-hairline overflow-hidden rounded-theme border border-hairline bg-surface shadow-xs">
        {catalog.menus.map((menu) => (
          <div
            key={menu.id}
            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-medium text-ink">
                  {getLocalizedText(menu.name, 'th')}
                </p>
              </div>
              <p className="mt-0.5 font-mono text-xs text-ink-secondary tabular-nums">
                {menu.variants
                  .map((v) => `${getLocalizedText(v.name, 'th')} ${v.price}฿`)
                  .join(' / ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg bg-subtle p-1 text-xs">
                {(['ACTIVE', 'OUT_OF_STOCK', 'BANNED'] as const).map((status) => {
                  const active = menu.status === status;
                  const label =
                    status === 'ACTIVE'
                      ? 'ขายปกติ'
                      : status === 'OUT_OF_STOCK'
                        ? 'ของหมด'
                        : 'งดสั่ง (Banned)';
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
              <button
                type="button"
                onClick={() => handleDeleteMenu(menu.id)}
                aria-label={`ลบเมนู ${getLocalizedText(menu.name, 'th')}`}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ลบเมนู</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
