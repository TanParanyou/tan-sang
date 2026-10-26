'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  LayoutGrid,
  List,
  Lock,
  Pencil,
  Plus,
  Printer,
  Search,
  Share2,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { NamePromptModal } from '@/components/shared/name-prompt-modal';
import { useLiff } from '@/features/line/liff-provider';
import type {
  OrderItem,
  OrderSession,
  OrderSessionSummary,
} from '@/features/order-session/order-session.schema';
import type {
  MenuOption,
  StoreCatalogAggregate,
  StoreMenu,
} from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText, type SupportedLocale } from '@/lib/utils/i18n.schema';
import {
  calculateOrderItemTotals,
  formatOrderItemTitle,
} from '@/server/services/order-calculator.service';
import {
  Button,
  Input,
  Card,
  Badge,
  Chip,
  QuantityStepper,
  ConfirmDialog,
} from '@/components/ui';

interface SessionDetailPayload {
  session: OrderSession;
  catalog: StoreCatalogAggregate | null;
  summary: OrderSessionSummary;
}

export function OrderSessionClient({
  sessionId,
  initialData,
}: {
  sessionId: string;
  initialData: SessionDetailPayload;
}) {
  const { profile, updateProfileName, isCustomName, shareBillToLine, shareSessionInviteToLine } = useLiff();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'TRAY'>('CATALOG');
  const [closedViewMode, setClosedViewMode] = useState<'GROUPED' | 'INDIVIDUAL'>('GROUPED');
  const [catalogViewMode, setCatalogViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [locale, setLocale] = useState<SupportedLocale>('th');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // In-app confirm modal dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tan_sang_catalog_view_mode');
      if (saved === 'GRID' || saved === 'LIST') {
        setCatalogViewMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Prompt user for their name if entering an open session without a customized name
  useEffect(() => {
    if (initialData.session.status === 'OPEN' && !isCustomName) {
      const timer = setTimeout(() => {
        setIsNameModalOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isCustomName, initialData.session.status]);

  const handleCatalogViewModeChange = (mode: 'LIST' | 'GRID') => {
    setCatalogViewMode(mode);
    try {
      localStorage.setItem('tan_sang_catalog_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Drawer state for selecting menu item, custom item, or editing existing item
  const [selectedMenu, setSelectedMenu] = useState<StoreMenu | null>(null);
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  // Form states inside drawer
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState<string>(profile.displayName);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [customMenuName, setCustomMenuName] = useState<string>('');
  const [customUnitPrice, setCustomUnitPrice] = useState<string>('0');
  const [showCustomRecipient, setShowCustomRecipient] = useState<boolean>(false);

  useEffect(() => {
    if (!editingItem) {
      setRecipientName(profile.displayName);
      setShowCustomRecipient(false);
    }
  }, [profile.displayName, editingItem]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleVoteBan = async (e: React.MouseEvent, menuId: string) => {
    e.stopPropagation();
    try {
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
        data?: { id: string; voteBanCount: number; status: string };
      };
      if (json.ok) {
        await queryClient.invalidateQueries({ queryKey: ['order-session', sessionId] });
        showToast('บันทึกการโหวตแบนแล้ว (ครบ 3 โหวตจะงดสั่งอัตโนมัติ)');
      }
    } catch {
      showToast('ไม่สามารถโหวตแบนเมนูได้');
    }
  };

  const { data } = useQuery<SessionDetailPayload>({
    queryKey: ['order-session', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`);
      const json = (await res.json()) as { ok: boolean; data: SessionDetailPayload };
      if (!json.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลห้องสั่งอาหารได้');
      }
      return json.data;
    },
    initialData,
    refetchInterval: (query) =>
      query.state.data?.session.status === 'OPEN' ? 4000 : false,
  });

  const { session, catalog, summary } = data;
  const isOpen = session.status === 'OPEN';
  const isHost = session.hostUserId === profile.userId;
  const isCurrentUserReady = session.readyUsers.some((u) => u.userId === profile.userId);

  const availableOptions = useMemo<MenuOption[]>(() => {
    if (!catalog) return [];
    if (!selectedMenu) return catalog.storeWideOptions;
    return [...catalog.storeWideOptions, ...selectedMenu.options].filter(
      (opt) => opt.isAvailable,
    );
  }, [catalog, selectedMenu]);

  const filteredMenus = useMemo(() => {
    if (!catalog) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalog.menus;
    return catalog.menus.filter((m) => {
      const th = m.name.th.toLowerCase();
      const en = (m.name.en ?? '').toLowerCase();
      if (th.includes(q) || en.includes(q)) return true;
      return m.variants.some((v) => {
        const vth = v.name.th.toLowerCase();
        const ven = (v.name.en ?? '').toLowerCase();
        return vth.includes(q) || ven.includes(q);
      });
    });
  }, [catalog, searchQuery]);

  const myItems = useMemo(
    () => session.items.filter((i) => i.orderedByUserId === profile.userId),
    [session.items, profile.userId],
  );

  const myTotalAmount = useMemo(
    () =>
      myItems.reduce((sum, item) => sum + calculateOrderItemTotals(item).lineTotal, 0),
    [myItems],
  );

  const openMenuDrawer = (menu: StoreMenu) => {
    if (!isOpen || menu.status !== 'ACTIVE') return;
    const defaultVariant =
      menu.variants.find((v) => v.isDefault) ?? menu.variants[0];
    setEditingItem(null);
    setSelectedMenu(menu);
    setIsCustomDrawerOpen(false);
    setSelectedVariantId(defaultVariant?.id ?? '');
    setSelectedOptionIds([]);
    setRecipientName(profile.displayName);
    setShowCustomRecipient(false);
    setQuantity(1);
    setNote('');
  };

  const openCustomItemDrawer = () => {
    if (!isOpen) return;
    setEditingItem(null);
    setSelectedMenu(null);
    setIsCustomDrawerOpen(true);
    setCustomMenuName('');
    setCustomUnitPrice('0');
    setSelectedOptionIds([]);
    setRecipientName(profile.displayName);
    setShowCustomRecipient(false);
    setQuantity(1);
    setNote('');
  };

  const openEditItemDrawer = (item: OrderItem) => {
    if (!isOpen) return;
    setEditingItem(item);
    setRecipientName(item.recipientName);
    setShowCustomRecipient(item.recipientName !== profile.displayName);
    setQuantity(item.quantity);
    setNote(item.note ?? '');

    const matchedMenu = catalog?.menus.find((m) => m.id === item.menuId) ?? null;
    const matchedOptionIds = item.options
      .map((o) => o.optionId)
      .filter((id): id is string => Boolean(id));
    setSelectedOptionIds(matchedOptionIds);

    if (matchedMenu) {
      setSelectedMenu(matchedMenu);
      setIsCustomDrawerOpen(false);
      const matchedVariant =
        matchedMenu.variants.find(
          (v) =>
            getLocalizedText(v.name, 'th') === item.variantName ||
            getLocalizedText(v.name, 'en') === item.variantName,
        ) ?? matchedMenu.variants[0];
      setSelectedVariantId(matchedVariant?.id ?? '');
    } else {
      setSelectedMenu(null);
      setIsCustomDrawerOpen(true);
      setCustomMenuName(item.menuName);
      setCustomUnitPrice(String(item.unitPrice));
    }
  };

  const closeDrawer = () => {
    setSelectedMenu(null);
    setIsCustomDrawerOpen(false);
    setEditingItem(null);
    setShowCustomRecipient(false);
  };

  const upsertItemMutation = useMutation({
    mutationFn: async () => {
      const chosenOptions = availableOptions
        .filter((opt) => selectedOptionIds.includes(opt.id))
        .map((opt) => ({
          optionId: opt.id,
          optionName: getLocalizedText(opt.name, locale),
          price: opt.price,
        }));

      let payload: Record<string, unknown>;

      if (selectedMenu) {
        const chosenVariant =
          selectedMenu.variants.find((v) => v.id === selectedVariantId) ??
          selectedMenu.variants[0];
        payload = {
          orderedByUserId: editingItem?.orderedByUserId ?? profile.userId,
          recipientName: recipientName.trim() || profile.displayName,
          menuId: selectedMenu.id,
          menuName: getLocalizedText(selectedMenu.name, locale),
          variantName: chosenVariant ? getLocalizedText(chosenVariant.name, locale) : null,
          unitPrice: chosenVariant?.price ?? 0,
          quantity,
          note: note.trim() || null,
          options: chosenOptions,
        };
      } else {
        const parsedPrice = Number(customUnitPrice);
        payload = {
          orderedByUserId: editingItem?.orderedByUserId ?? profile.userId,
          recipientName: recipientName.trim() || profile.displayName,
          menuId: null,
          menuName: customMenuName.trim(),
          variantName: null,
          unitPrice: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
          quantity,
          note: note.trim() || null,
          options: chosenOptions,
        };
      }

      if (editingItem) {
        const res = await fetch(`/api/v1/sessions/${sessionId}/items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            itemId: editingItem.id,
            actorUserId: profile.userId,
          }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: SessionDetailPayload;
          error?: { message: string };
        };
        if (!json.ok || !json.data) {
          throw new Error(json.error?.message ?? 'ไม่สามารถแก้ไขรายการอาหารได้');
        }
        return { updated: json.data, isEdit: true };
      }

      const res = await fetch(`/api/v1/sessions/${sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? 'ไม่สามารถเพิ่มรายการอาหารได้');
      }
      return { updated: json.data, isEdit: false };
    },
    onSuccess: ({ updated, isEdit }) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      closeDrawer();
      setActiveTab('TRAY');
      showToast(isEdit ? 'บันทึกการแก้ไขรายการแล้ว' : 'เพิ่มรายการลงในบิลกลุ่มแล้ว');
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/v1/sessions/${sessionId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          actorUserId: profile.userId,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? 'ไม่สามารถลบรายการได้');
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      showToast('ลบรายการอาหารเรียบร้อยแล้ว');
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const toggleReadyMutation = useMutation({
    mutationFn: async (nextReadyState: boolean) => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_READY',
          userId: profile.userId,
          displayName: profile.displayName,
          isReady: nextReadyState,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? 'ไม่สามารถเปลี่ยนสถานะได้');
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_SESSION',
          actorUserId: profile.userId,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? 'ไม่สามารถปิดบิลได้');
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      showToast('ล็อกและปิดรับออเดอร์แล้ว');
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const handleCopyForMerchant = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summary.merchantCopyText);
      showToast('คัดลอกข้อความสำหรับส่งให้ร้านค้าแล้ว!');
    }
  };

  const handleCopyKhunThong = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summary.khunThongCopyText);
      showToast('คัดลอกยอดแยกรายคนสำหรับส่งให้ขุนทอง/กลุ่มแล้ว!');
    }
  };

  const handleCopyOrderLink = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const url = liffId
      ? `https://liff.line.me/${liffId}/order/${session.id}`
      : `${origin}/order/${session.id}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('คัดลอกลิงก์ห้องสั่งอาหารแล้ว นำไปแปะในกลุ่มแชทได้เลย!');
    }
  };

  const handleShareInviteToLine = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const orderUrl = liffId
      ? `https://liff.line.me/${liffId}/order/${session.id}`
      : `${origin}/order/${session.id}`;
    const receiptUrl = liffId
      ? `https://liff.line.me/${liffId}/receipt/${session.id}`
      : `${origin}/receipt/${session.id}`;

    const res = await shareSessionInviteToLine({
      sessionId: session.id,
      storeDisplayName: summary.storeDisplayName,
      totalQuantity: summary.totalItemsCount,
      grandTotalAmount: summary.grandTotalAmount,
      orderUrl,
      receiptUrl,
    });
    showToast(res.message);
  };

  const handleShareToLine = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const res = await shareBillToLine(
      {
        sessionId: session.id,
        storeDisplayName: summary.storeDisplayName,
        totalQuantity: summary.totalItemsCount,
        grandTotalAmount: summary.grandTotalAmount,
        orderUrl: `${origin}/order/${session.id}`,
        receiptUrl: `${origin}/receipt/${session.id}`,
      },
      summary.recipientBreakdowns,
    );
    showToast(res.message);
  };

  // Calculate preview price inside drawer
  const drawerPreviewTotal = useMemo(() => {
    const optionsSum = availableOptions
      .filter((o) => selectedOptionIds.includes(o.id))
      .reduce((s, o) => s + o.price, 0);

    if (selectedMenu) {
      const v =
        selectedMenu.variants.find((item) => item.id === selectedVariantId) ??
        selectedMenu.variants[0];
      return ((v?.price ?? 0) + optionsSum) * quantity;
    }

    const base = Number(customUnitPrice) || 0;
    return (base + optionsSum) * quantity;
  }, [
    availableOptions,
    selectedOptionIds,
    selectedMenu,
    selectedVariantId,
    quantity,
    customUnitPrice,
  ]);

  return (
    <div className="min-h-screen bg-canvas pb-32">
      <DevPersonaBar hostUserId={session.hostUserId} />

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 border border-hairline rounded-theme bg-ink px-4 py-2 text-xs font-medium text-surface shadow-theme"
        >
          {toastMessage}
        </div>
      )}

      {/* Unified App Header */}
      <AppNavbar
        backHref="/history"
        backLabel="ประวัติ"
        title={catalog ? getLocalizedText(catalog.store.name, locale) : summary.storeDisplayName}
        subtitle={
          <div className="flex items-center gap-1.5 leading-tight">
            {isOpen ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                เปิดรับ
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                <Lock className="h-2.5 w-2.5 mr-0.5 inline" />
                ปิดรับ
              </span>
            )}
            <span className="text-ink-muted">•</span>
            <span className="font-mono text-[11px] text-ink-muted tabular-nums">
              {summary.totalItemsCount} จาน • {summary.grandTotalAmount.toLocaleString('th-TH')} ฿
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Compact TH / EN Switcher */}
            <div
              role="group"
              aria-label="เปลี่ยนภาษา / Switch Language"
              className="inline-flex rounded-theme border border-hairline bg-canvas p-0.5 text-xs font-semibold"
            >
              <button
                type="button"
                onClick={() => setLocale('th')}
                className={`rounded-theme px-1.5 py-0.5 text-[11px] transition ${
                  locale === 'th'
                    ? 'bg-ink text-surface font-bold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-theme px-1.5 py-0.5 text-[11px] transition ${
                  locale === 'en'
                    ? 'bg-ink text-surface font-bold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-theme border border-hairline bg-surface px-2 py-1 text-xs font-medium text-ink shadow-2xs transition hover:bg-subtle"
              title="แตะเพื่อเปลี่ยนชื่อผู้สั่ง"
            >
              <span className="max-w-[75px] truncate font-semibold">{profile.displayName}</span>
              <Pencil className="h-3 w-3 text-ink-muted shrink-0" />
            </button>

            <Link
              href={`/receipt/${session.id}`}
              aria-label="ดูใบเสร็จ"
              title="ดูใบเสร็จ"
              className="inline-flex min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:px-2.5 items-center justify-center gap-1 rounded-theme border border-hairline bg-surface text-xs font-medium text-ink shadow-2xs transition hover:bg-subtle"
            >
              <Printer className="h-3.5 w-3.5 text-ink-secondary" />
              <span className="hidden sm:inline">ใบเสร็จ</span>
            </Link>
          </div>
        }
        maxWidthClassName="max-w-lg"
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-lg px-4 pt-3">
        {/* Ready Participants Bar (In-flow, clean and spacious) */}
        <div className="mb-3 flex items-center justify-between gap-2 rounded-theme border border-hairline bg-surface px-3 py-2 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-ink-secondary overflow-x-auto scrollbar-none">
            <span className="shrink-0 font-medium text-ink-muted">
              เลือกเสร็จแล้ว ({session.readyUsers.length}):
            </span>
            {session.readyUsers.length === 0 ? (
              <span className="text-ink-muted">ยังไม่มีใครกดยืนยัน</span>
            ) : (
              session.readyUsers.map((u) => (
                <span
                  key={u.userId}
                  className="inline-flex shrink-0 items-center gap-1 rounded-theme border border-hairline bg-subtle px-2 py-0.5 text-xs font-medium text-ink"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  {u.displayName}
                </span>
              ))
            )}
          </div>
        </div>
        {isOpen && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-theme border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-950">
              <span className="font-semibold">ชวนเพื่อนเข้าตี้สั่งอาหาร:</span>
              <span className="hidden sm:inline text-[11px] text-emerald-700">(ใช้ร่วมกับกลุ่มที่มีขุนทองได้)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyOrderLink}
                className="h-7 border-emerald-300 bg-white text-[11px] text-emerald-800 hover:bg-emerald-100"
                title="คัดลอกลิงก์สั่งอาหาร"
              >
                <Copy className="h-3 w-3" />
                <span>คัดลอกลิงก์</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleShareInviteToLine}
                className="h-7 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                title="แชร์การ์ดสั่งอาหารเข้ากลุ่ม LINE (ใช้ร่วมกับกลุ่มที่มีขุนทองได้)"
              >
                <Share2 className="h-3 w-3" />
                <span>แชร์เข้ากลุ่ม LINE</span>
              </Button>
            </div>
          </div>
        )}
        {isOpen ? (
          <>
            {/* Segmented Tab Switcher (Catalog vs Group Tray) */}
            <div
              role="tablist"
              aria-label="มุมมองการสั่งอาหาร"
              className="grid grid-cols-2 gap-1 rounded-theme bg-subtle p-1 border border-hairline"
            >
              <Chip
                role="tab"
                aria-selected={activeTab === 'CATALOG'}
                selected={activeTab === 'CATALOG'}
                onClick={() => setActiveTab('CATALOG')}
                className="w-full text-center"
              >
                เลือกเมนูอาหาร
              </Chip>
              <Chip
                role="tab"
                aria-selected={activeTab === 'TRAY'}
                selected={activeTab === 'TRAY'}
                onClick={() => setActiveTab('TRAY')}
                className="w-full text-center"
              >
                รายการในห้อง ({summary.totalItemsCount})
              </Chip>
            </div>

            {activeTab === 'CATALOG' ? (
              <section className="mt-4 space-y-3" aria-label="รายการเมนูร้านค้า">
                {/* Search & Custom Dish Action */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาเมนู เช่น กะเพรา, ข้าวผัด..."
                      className="min-h-[44px] h-[44px] w-full rounded-theme border border-hairline bg-surface pl-9 pr-9 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="ล้างคำค้นหา"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted transition hover:bg-subtle hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={openCustomItemDrawer}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">พิมพ์เมนูเอง</span>
                    <span className="sm:hidden">พิมพ์เอง</span>
                  </Button>
                </div>

                {/* Sub-bar: Count & List/Grid Switcher */}
                {catalog && catalog.menus.length > 0 && (
                  <div className="flex items-center justify-between px-0.5 text-xs text-ink-secondary">
                    <span className="truncate pr-2">
                      {searchQuery ? (
                        <>
                          พบ <span className="font-semibold text-ink">{filteredMenus.length}</span> เมนู
                        </>
                      ) : (
                        <>
                          เมนูทั้งหมด <span className="font-semibold text-ink">{filteredMenus.length}</span> รายการ
                        </>
                      )}
                    </span>

                    {/* View Switcher */}
                    <div
                      role="group"
                      aria-label="รูปแบบมุมมองเมนู"
                      className="inline-flex shrink-0 items-center rounded-theme border border-hairline bg-subtle p-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleCatalogViewModeChange('LIST')}
                        aria-label="มุมมองรายการ"
                        aria-pressed={catalogViewMode === 'LIST'}
                        title="มุมมองรายการ (List)"
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-theme transition ${
                          catalogViewMode === 'LIST'
                            ? 'bg-surface text-ink shadow-2xs font-bold'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCatalogViewModeChange('GRID')}
                        aria-label="มุมมองตาราง"
                        aria-pressed={catalogViewMode === 'GRID'}
                        title="มุมมองตาราง (Grid)"
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-theme transition ${
                          catalogViewMode === 'GRID'
                            ? 'bg-surface text-ink shadow-2xs font-bold'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Menus List or Grid */}
                {filteredMenus.length > 0 ? (
                  catalogViewMode === 'GRID' ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      {filteredMenus.map((menu) => {
                        const isAvailable = menu.status === 'ACTIVE';
                        const defaultVariant =
                          menu.variants.find((v) => v.isDefault) ?? menu.variants[0];
                        const maxVariant = menu.variants[menu.variants.length - 1];
                        const priceLabel =
                          defaultVariant && maxVariant && defaultVariant.price !== maxVariant.price
                            ? `${defaultVariant.price}–${maxVariant.price} ฿`
                            : `${defaultVariant?.price ?? 0} ฿`;

                        const subtitle =
                          locale === 'th' ? menu.name.en : menu.name.th;

                        return (
                          <div
                            key={menu.id}
                            role="button"
                            tabIndex={isAvailable ? 0 : -1}
                            onClick={() => isAvailable && openMenuDrawer(menu)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
                                e.preventDefault();
                                openMenuDrawer(menu);
                              }
                            }}
                            className={`group relative flex flex-col justify-between rounded-theme border border-hairline bg-surface p-3.5 shadow-2xs transition-all ${
                              isAvailable
                                ? 'cursor-pointer hover:border-ink hover:shadow-theme active:scale-[0.98]'
                                : 'cursor-not-allowed opacity-55'
                            }`}
                          >
                            <div>
                              <div className="mb-2 flex items-start justify-between gap-1.5 min-h-[20px]">
                                <div className="flex flex-wrap gap-1">
                                  {menu.status === 'OUT_OF_STOCK' && (
                                    <Badge variant="muted" className="text-[10px] py-0.5 px-1.5">
                                      หมดชั่วคราว
                                    </Badge>
                                  )}
                                  {menu.status === 'BANNED' && (
                                    <Badge variant="warning" className="text-[10px] py-0.5 px-1.5">
                                      งดสั่ง
                                    </Badge>
                                  )}
                                  {menu.variants.length > 1 && (
                                    <span className="inline-flex items-center rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                      {menu.variants.length} ขนาด
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-[15px] font-medium leading-snug text-ink line-clamp-2">
                                {getLocalizedText(menu.name, locale)}
                              </h3>
                              {subtitle && (
                                <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">{subtitle}</p>
                              )}
                            </div>

                            <div className="mt-3.5 flex items-center justify-between border-t border-hairline/60 pt-2.5">
                              <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                                {priceLabel}
                              </span>
                              {isAvailable && (
                                <span
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-theme border border-ink bg-ink text-surface shadow-2xs transition group-hover:bg-neutral-800"
                                  aria-hidden="true"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="divide-y divide-hairline overflow-hidden">
                      {filteredMenus.map((menu) => {
                        const isAvailable = menu.status === 'ACTIVE';
                        const defaultVariant =
                          menu.variants.find((v) => v.isDefault) ?? menu.variants[0];
                        const maxVariant = menu.variants[menu.variants.length - 1];
                        const priceLabel =
                          defaultVariant && maxVariant && defaultVariant.price !== maxVariant.price
                            ? `${defaultVariant.price}–${maxVariant.price} ฿`
                            : `${defaultVariant?.price ?? 0} ฿`;

                        const subtitle =
                          locale === 'th' ? menu.name.en : menu.name.th;

                        return (
                          <div
                            key={menu.id}
                            className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 transition hover:bg-subtle"
                          >
                            <div
                              role="button"
                              tabIndex={isAvailable ? 0 : -1}
                              onClick={() => isAvailable && openMenuDrawer(menu)}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
                                  e.preventDefault();
                                  openMenuDrawer(menu);
                                }
                              }}
                              className={`min-w-0 flex-1 ${
                                isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[15px] font-medium text-ink">
                                  {getLocalizedText(menu.name, locale)}
                                </span>
                                {menu.status === 'OUT_OF_STOCK' && (
                                  <Badge variant="muted" className="text-[10px] py-0.5">
                                    หมดชั่วคราว
                                  </Badge>
                                )}
                                {menu.status === 'BANNED' && (
                                  <Badge variant="warning" className="text-[10px] py-0.5">
                                    งดสั่ง (Banned)
                                  </Badge>
                                )}
                                {menu.variants.length > 1 && (
                                  <span className="inline-flex items-center rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                    {menu.variants.length} ขนาด
                                  </span>
                                )}
                              </div>
                              {subtitle && (
                                <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                role="button"
                                tabIndex={isAvailable ? 0 : -1}
                                onClick={() => isAvailable && openMenuDrawer(menu)}
                                className={`font-mono text-sm font-semibold text-ink tabular-nums ${
                                  isAvailable ? 'cursor-pointer' : 'opacity-55'
                                }`}
                              >
                                {priceLabel}
                              </span>
                              {isAvailable && (
                                <button
                                  type="button"
                                  aria-label={`เลือกเมนู ${getLocalizedText(menu.name, locale)}`}
                                  onClick={() => openMenuDrawer(menu)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-ink bg-ink text-surface transition hover:bg-neutral-800"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </Card>
                  )
                ) : (
                  <Card className="p-8 text-center">
                    <UtensilsCrossed className="mx-auto h-8 w-8 text-ink-muted" />
                    <h3 className="mt-2 text-base font-semibold text-ink">
                      {searchQuery ? 'ไม่พบเมนูที่ค้นหา' : 'โหมดพิมพ์สั่งอาหารตามใจชอบ'}
                    </h3>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {searchQuery
                        ? 'สามารถแตะปุ่มด้านล่างเพื่อพิมพ์เมนูนี้เอง หรือล้างคำค้นหา'
                        : 'แตะปุ่มด้านล่างเพื่อพิมพ์ชื่อเมนู ขนาด ท็อปปิ้ง และราคาได้ทันที'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={() => setSearchQuery('')}
                        >
                          ล้างคำค้นหา
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={openCustomItemDrawer}
                      >
                        <Plus className="h-4 w-4" />
                        พิมพ์สั่งอาหารเลย
                      </Button>
                    </div>
                  </Card>
                )}
              </section>
            ) : (
              /* Group Tray Tab (while OPEN) */
              <section className="mt-4 space-y-3" aria-label="รายการอาหารในห้อง">
                {session.items.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-ink-secondary">
                      ยังไม่มีรายการอาหารในห้องนี้ กดเลือกเมนูจากแท็บแรกได้เลย
                    </p>
                  </Card>
                ) : (
                  <Card className="divide-y divide-hairline overflow-hidden">
                    {session.items.map((item) => {
                      const { lineTotal } = calculateOrderItemTotals(item);
                      const canMutate =
                        item.orderedByUserId === profile.userId || isHost;
                      const title = formatOrderItemTitle(
                        item.menuName,
                        item.variantName,
                        item.options.map((o) => o.optionName),
                      );

                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="muted" className="text-[11px] py-0.5">
                                {item.recipientName}
                              </Badge>
                              {(() => {
                                const isItemUserReady = session.readyUsers.some(
                                  (u) =>
                                    u.userId === item.orderedByUserId ||
                                    u.displayName === item.recipientName,
                                );
                                return isItemUserReady ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                                    พร้อมแล้ว
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700">
                                    <Clock className="h-2.5 w-2.5 text-amber-500" />
                                    กำลังเลือก
                                  </span>
                                );
                              })()}
                              <span className="font-mono text-xs font-semibold text-ink tabular-nums">
                                x {item.quantity}
                              </span>
                            </div>
                            <p className="mt-1 text-[15px] font-medium text-ink">{title}</p>
                            {item.note && (
                              <p className="mt-0.5 text-xs text-ink-secondary">
                                หมายเหตุ: {item.note}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="mr-1 font-mono text-sm font-semibold text-ink tabular-nums">
                              {lineTotal.toLocaleString('th-TH')} ฿
                            </span>
                            {canMutate && (
                              <>
                                <button
                                  type="button"
                                  aria-label={`แก้ไขรายการ ${title}`}
                                  onClick={() => openEditItemDrawer(item)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-hairline text-ink-secondary transition hover:bg-subtle hover:text-ink"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`ลบรายการ ${title}`}
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'ลบรายการอาหาร',
                                      description: `คุณต้องการลบรายการ "${title}" ใช่หรือไม่?`,
                                      confirmText: 'ลบรายการ',
                                      variant: 'danger',
                                      onConfirm: () => {
                                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                                        deleteItemMutation.mutate(item.id);
                                      },
                                    });
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-hairline text-ink-secondary transition hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </section>
            )}
          </>
        ) : (
          /* ==================================================================
             CLOSED STATE: Merchant Export & Split Bill Breakdown
             ================================================================== */
          <section className="space-y-4" aria-label="สรุปยอดหลังปิดบิล">
            {/* Primary Export Actions */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCopyForMerchant}
                className="w-full"
              >
                <Copy className="h-4 w-4" />
                คัดลอกส่งร้านค้า
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleCopyKhunThong}
                className="w-full border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
                title="คัดลอกยอดแยกรายคนเพื่อนำไปให้ขุนทองช่วยหารบิล"
              >
                <Coins className="h-4 w-4 text-amber-600" />
                คัดลอกส่งขุนทอง
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleShareToLine}
                className="w-full"
              >
                <Share2 className="h-4 w-4" />
                แชร์สรุปบิลเข้าแชท LINE
              </Button>
            </div>

            {/* Toggle: Grouped View vs Individual Breakdown */}
            <div className="grid grid-cols-2 gap-1 rounded-theme bg-subtle p-1 border border-hairline">
              <Chip
                selected={closedViewMode === 'GROUPED'}
                onClick={() => setClosedViewMode('GROUPED')}
                className="w-full text-center"
              >
                รวมตามเมนู ({summary.groupedItems.length})
              </Chip>
              <Chip
                selected={closedViewMode === 'INDIVIDUAL'}
                onClick={() => setClosedViewMode('INDIVIDUAL')}
                className="w-full text-center"
              >
                แยกตามรายชื่อ ({summary.recipientBreakdowns.length})
              </Chip>
            </div>

            {closedViewMode === 'GROUPED' ? (
              <Card className="divide-y divide-hairline overflow-hidden">
                {summary.groupedItems.map((group, idx) => {
                  const title = formatOrderItemTitle(
                    group.menuName,
                    group.variantName,
                    group.optionNames,
                  );
                  return (
                    <div
                      key={group.fingerprint}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-ink">
                          <span className="mr-1.5 font-mono text-xs text-ink-muted">
                            {idx + 1}.
                          </span>
                          {title}
                        </p>
                        {group.note && (
                          <p className="mt-0.5 text-xs font-medium text-ink">
                            หมายเหตุ: {group.note}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-secondary">
                          คนสั่ง:{' '}
                          {group.recipients
                            .map((r) =>
                              r.quantity > 1
                                ? `${r.recipientName} (${r.quantity})`
                                : r.recipientName,
                            )
                            .join(', ')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right font-mono tabular-nums">
                        <span className="inline-block border border-hairline rounded-theme bg-subtle px-2 py-0.5 text-xs font-bold text-ink">
                          x {group.totalQuantity}
                        </span>
                        <p className="mt-1 text-xs text-ink-secondary">
                          {group.totalPrice.toLocaleString('th-TH')} ฿
                        </p>
                      </div>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <Card className="divide-y divide-hairline overflow-hidden">
                {summary.recipientBreakdowns.map((person) => (
                  <div key={person.recipientName} className="px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">
                        {person.recipientName}
                      </span>
                      <span className="font-mono text-sm font-bold text-ink tabular-nums">
                        {person.totalAmount.toLocaleString('th-TH')} ฿
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {person.items.map((item) => (
                        <li
                          key={item.itemId}
                          className="flex items-baseline justify-between gap-2 text-xs text-ink-secondary"
                        >
                          <span>
                            • {item.displayTitle}
                            {item.note ? ` [${item.note}]` : ''} × {item.quantity}
                          </span>
                          <span className="font-mono tabular-nums">
                            {item.lineTotal.toLocaleString('th-TH')} ฿
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Card>
            )}

            {/* Merchant & KhunThong Text Preview Box */}
            <Card className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                    ข้อความพร้อมส่งร้านค้า
                  </span>
                  <Link
                    href={`/receipt/${session.id}`}
                    className="text-xs font-semibold text-ink underline underline-offset-2 hover:text-neutral-700"
                  >
                    เปิดหน้าพิมพ์ใบเสร็จ (80mm / A4) →
                  </Link>
                </div>
                <pre className="mt-2 whitespace-pre-wrap rounded-theme border border-hairline bg-canvas p-3 font-mono text-xs leading-relaxed text-ink">
                  {summary.merchantCopyText}
                </pre>
              </div>

              <div className="border-t border-hairline pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
                    <Coins className="h-3.5 w-3.5 text-amber-600" />
                    ข้อความสำหรับส่งให้ขุนทอง / เรียกเก็บเงิน
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyKhunThong}
                    className="h-6 px-2 text-[10px] border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    คัดลอกยอด
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-theme border border-amber-200 bg-amber-50/50 p-3 font-mono text-xs leading-relaxed text-amber-950">
                  {summary.khunThongCopyText}
                </pre>
              </div>
            </Card>
          </section>
        )}
      </main>

      {/* ====================================================================
          Slide-Up Menu / Custom Item / Edit Selection Drawer
          ==================================================================== */}
      {(selectedMenu || isCustomDrawerOpen) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="เลือกรายละเอียดเมนูอาหาร"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-theme border border-hairline bg-surface p-5 shadow-theme">
            <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
              <div>
                <h2 className="text-base font-bold text-ink">
                  {editingItem
                    ? `แก้ไข: ${selectedMenu ? getLocalizedText(selectedMenu.name, locale) : customMenuName}`
                    : selectedMenu
                      ? getLocalizedText(selectedMenu.name, locale)
                      : 'สั่งเมนูพิเศษนอกรายการ'}
                </h2>
                <p className="text-xs text-ink-secondary">
                  เลือกขนาด ท็อปปิ้ง และระบุชื่อคนรับอาหาร
                </p>
              </div>
              <button
                type="button"
                aria-label="ปิดหน้าต่างเลือกเมนู"
                onClick={closeDrawer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-hairline bg-subtle text-ink-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Custom Menu Fields */}
              {isCustomDrawerOpen && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="ชื่อเมนูอาหาร"
                      required
                      value={customMenuName}
                      onChange={(e) => setCustomMenuName(e.target.value)}
                      placeholder="เช่น ข้าวผัดแหนม"
                    />
                  </div>
                  <div>
                    <Input
                      label="ราคา (บาท)"
                      type="number"
                      min={0}
                      value={customUnitPrice}
                      onChange={(e) => setCustomUnitPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {/* Variants Radio Pills */}
              {selectedMenu && selectedMenu.variants.length > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-ink">เลือกขนาด / ราคา</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {selectedMenu.variants.map((variant) => {
                      const active = variant.id === selectedVariantId;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`flex min-h-[44px] h-[44px] items-center justify-between rounded-theme border px-3.5 text-sm font-medium transition ${
                            active
                              ? 'border-ink bg-ink text-surface'
                              : 'border-hairline bg-surface text-ink hover:bg-subtle'
                          }`}
                        >
                          <span>{getLocalizedText(variant.name, locale)}</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {variant.price} ฿
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-on Options Checkboxes */}
              {availableOptions.length > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-ink">
                    เพิ่มเติม / ท็อปปิ้ง (เลือกได้หลายข้อ)
                  </span>
                  <div className="mt-1.5 divide-y divide-hairline rounded-theme border border-hairline bg-surface">
                    {availableOptions.map((opt) => {
                      const checked = selectedOptionIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex min-h-[44px] cursor-pointer items-center justify-between px-3.5 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2.5 text-ink">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOptionIds((prev) => [...prev, opt.id]);
                                } else {
                                  setSelectedOptionIds((prev) =>
                                    prev.filter((id) => id !== opt.id),
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded-theme border-hairline text-ink accent-black focus:ring-ink"
                            />
                            {getLocalizedText(opt.name, locale)}
                          </span>
                          <span className="font-mono text-xs font-semibold text-ink-secondary tabular-nums">
                            +{opt.price} ฿
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recipient Name Toggle & Quantity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink">จำนวนจาน</label>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    className="w-36 justify-between"
                  />
                </div>

                {!showCustomRecipient ? (
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-subtle/50 px-3.5 py-2.5 text-xs">
                    <span className="text-ink-secondary">
                      สั่งในชื่อ:{' '}
                      <strong className="text-ink font-semibold">
                        {recipientName.trim() || profile.displayName}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomRecipient(true)}
                      className="font-semibold text-chili hover:underline"
                    >
                      + สั่งให้คนอื่น (ฝากสั่ง)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-hairline bg-subtle/40 p-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-ink">
                        สั่งให้ใคร (ระบุชื่อผู้รับ)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientName(profile.displayName);
                          setShowCustomRecipient(false);
                        }}
                        className="text-[11px] font-medium text-ink-muted hover:text-ink hover:underline"
                      >
                        ใช้ชื่อฉันเอง ({profile.displayName})
                      </button>
                    </div>
                    <Input
                      autoFocus
                      placeholder="ระบุชื่อเพื่อนที่ฝากสั่ง..."
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Special Note */}
              <div>
                <Input
                  label="หมายเหตุถึงร้าน (ถ้ามี)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น เผ็ดน้อย, ไม่ใส่กระเทียม, แยกน้ำ"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={
                  upsertItemMutation.isPending ||
                  (isCustomDrawerOpen && customMenuName.trim().length === 0)
                }
                loading={upsertItemMutation.isPending}
                onClick={() => upsertItemMutation.mutate()}
                className="w-full justify-between"
              >
                <span>{editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มลงในบิลกลุ่ม'}</span>
                <span className="font-mono font-bold tabular-nums">
                  {drawerPreviewTotal.toLocaleString('th-TH')} ฿
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          Sticky Bottom Dock (while OPEN) - Docked directly to screen bottom
          ==================================================================== */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 transform-gpu translate-z-0 will-change-transform border-t border-hairline bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-theme">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-ink-secondary flex items-center gap-1">
                    <span>ของ</span>
                    <button
                      type="button"
                      onClick={() => setIsNameModalOpen(true)}
                      className="inline-flex items-center gap-1 font-bold text-ink underline decoration-dotted decoration-ink/40 hover:text-chili transition cursor-pointer"
                      title="แตะเพื่อเปลี่ยนชื่อของคุณ"
                    >
                      <span className="max-w-[120px] truncate">{profile.displayName}</span>
                      <Pencil className="h-2.5 w-2.5 text-ink-muted shrink-0" />
                    </button>
                    <span>({myItems.length} รายการ)</span>
                  </p>
                  {isCurrentUserReady ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                      พร้อมแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700">
                      กำลังเลือก
                    </span>
                  )}
                </div>
                <p className="font-mono text-base font-bold text-ink tabular-nums">
                  {myTotalAmount.toLocaleString('th-TH')} ฿
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isCurrentUserReady ? 'secondary' : 'primary'}
                  size="md"
                  disabled={toggleReadyMutation.isPending}
                  loading={toggleReadyMutation.isPending}
                  onClick={() => toggleReadyMutation.mutate(!isCurrentUserReady)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCurrentUserReady ? 'ยกเลิกพร้อม' : 'กดเมื่อพร้อม'}
                </Button>

                {isHost && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={closeSessionMutation.isPending}
                    loading={closeSessionMutation.isPending}
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'ยืนยันการปิดบิล',
                        description: `ต้องการปิดรับออเดอร์ร้าน "${summary.storeDisplayName}" ใช่หรือไม่?\n\nเมื่อปิดแล้ว สมาชิกจะไม่สามารถสั่งหรือแก้ไขรายการอาหารเพิ่มได้ และระบบจะสรุปยอดบิลทันที`,
                        confirmText: 'ปิดบิล',
                        variant: 'danger',
                        onConfirm: () => {
                          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                          closeSessionMutation.mutate();
                        },
                      });
                    }}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    ปิดบิล
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
      />

      <NamePromptModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onSave={(newName) => {
          updateProfileName(newName);
          showToast(`บันทึกชื่อ "${newName}" เรียบร้อย`);
        }}
        currentName={profile.displayName}
        canClose={true}
      />
    </div>
  );
}
