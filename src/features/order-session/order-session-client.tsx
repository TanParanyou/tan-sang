'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CopyPlus,
  Dices,
  Globe,
  LayoutGrid,
  List,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { NamePromptModal } from '@/components/shared/name-prompt-modal';
import { PromptPayQrModal } from '@/components/shared/promptpay-qr-modal';
import { DeleteSessionButton } from '@/features/order-session/components/delete-session-button';
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
import { getRandomDish } from '@/features/food-randomizer/random-dishes';
import { getLocalizedText, type SupportedLocale } from '@/lib/utils/i18n.schema';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  buildOrderSessionSummary,
  calculateOrderItemTotals,
  formatOrderItemTitle,
} from '@/server/services/order-calculator.service';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { formatThaiDateTime } from '@/lib/utils/date';
import {
  Button,
  Input,
  Card,
  Badge,
  Chip,
  Avatar,
  QuantityStepper,
  ConfirmDialog,
  DropdownMenu,
  Toast,
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
  const { t, locale, setLocale } = useI18n();
  const {
    profile,
    updateProfileName,
    isLineUser,
    isCustomName,
    isReady,
    shareBillToLine,
    shareSessionInviteToLine,
  } = useLiff();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'TRAY'>('CATALOG');
  const [closedViewMode, setClosedViewMode] = useState<'GROUPED' | 'INDIVIDUAL'>('GROUPED');
  const [closedCopyTab, setClosedCopyTab] = useState<'MERCHANT' | 'KHUNTHONG'>('MERCHANT');
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [copiedKhunThong, setCopiedKhunThong] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'LIST' | 'GRID'>('LIST');
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

  // Delivery fee, packaging fee, discount, and settlement states
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [splitMethod, setSplitMethod] = useState<'EQUAL' | 'PROPORTIONAL'>('EQUAL');
  const [promptPayId, setPromptPayId] = useState<string>('');
  const [paidRecipients, setPaidRecipients] = useState<string[]>([]);
  const [isFeeSettingsOpen, setIsFeeSettingsOpen] = useState(false);
  const [promptPayModalData, setPromptPayModalData] = useState<{
    isOpen: boolean;
    recipientName: string;
    amount: number | null;
  }>({
    isOpen: false,
    recipientName: '',
    amount: null,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tan_sang_settlement_${sessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.deliveryFee === 'number') setDeliveryFee(parsed.deliveryFee);
        if (typeof parsed.packagingFee === 'number') setPackagingFee(parsed.packagingFee);
        if (typeof parsed.discount === 'number') setDiscount(parsed.discount);
        if (parsed.splitMethod === 'EQUAL' || parsed.splitMethod === 'PROPORTIONAL') {
          setSplitMethod(parsed.splitMethod);
        }
        if (typeof parsed.promptPayId === 'string') setPromptPayId(parsed.promptPayId);
        if (Array.isArray(parsed.paidRecipients)) setPaidRecipients(parsed.paidRecipients);
      } else {
        const fallbackPp = localStorage.getItem('promptpay_account_target') || '';
        if (fallbackPp) setPromptPayId(fallbackPp);
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  const updateSettlement = (updater: {
    deliveryFee?: number;
    packagingFee?: number;
    discount?: number;
    splitMethod?: 'EQUAL' | 'PROPORTIONAL';
    promptPayId?: string;
    paidRecipients?: string[];
  }) => {
    try {
      const key = `tan_sang_settlement_${sessionId}`;
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      const updated = {
        deliveryFee,
        packagingFee,
        discount,
        splitMethod,
        promptPayId,
        paidRecipients,
        ...current,
        ...updater,
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

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

  // Prompt user for their name ONLY if LIFF is ready, user does not have LINE, and has not set a custom name
  useEffect(() => {
    if (!isReady) return; // Wait until LIFF finishes initialization
    if (isLineUser || Boolean(profile.pictureUrl)) return; // Already has LINE account! Do not prompt
    if (initialData.session.status === 'OPEN' && !isCustomName) {
      const timer = setTimeout(() => {
        setIsNameModalOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isReady, isLineUser, profile.pictureUrl, isCustomName, initialData.session.status]);

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
        showToast(t.session.voteBanSuccess);
      }
    } catch {
      showToast(t.session.voteBanFailed);
    }
  };

  const { data } = useQuery<SessionDetailPayload>({
    queryKey: ['order-session', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`);
      const json = (await res.json()) as { ok: boolean; data: SessionDetailPayload };
      if (!json.ok) {
        throw new Error(t.session.loadSessionFailed);
      }
      return json.data;
    },
    initialData,
    refetchInterval: (query) =>
      query.state.data?.session.status === 'OPEN' ? 4000 : false,
  });

  const { session, catalog } = data;
  const isOpen = session.status === 'OPEN';
  const isHost = session.hostUserId === profile.userId;
  const isCurrentUserReady = session.readyUsers.some((u) => u.userId === profile.userId);

  const storeDisplayName = catalog
    ? getLocalizedText(catalog.store.name, locale)
    : session.customStoreName?.trim() || t.session.customStore;

  const summary = useMemo(() => {
    return buildOrderSessionSummary(session, storeDisplayName, {
      deliveryFee,
      packagingFee,
      discount,
      splitMethod,
    });
  }, [session, storeDisplayName, deliveryFee, packagingFee, discount, splitMethod]);

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
      const effectiveRecipient = recipientName.trim() || profile.displayName;
      const isSelf = effectiveRecipient === profile.displayName || !showCustomRecipient;
      const itemPictureUrl = isSelf
        ? (profile.pictureUrl ?? null)
        : (editingItem && editingItem.recipientName === effectiveRecipient ? editingItem.pictureUrl ?? null : null);

      if (selectedMenu) {
        const chosenVariant =
          selectedMenu.variants.find((v) => v.id === selectedVariantId) ??
          selectedMenu.variants[0];
        payload = {
          orderedByUserId: editingItem?.orderedByUserId ?? profile.userId,
          recipientName: effectiveRecipient,
          pictureUrl: itemPictureUrl,
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
          recipientName: effectiveRecipient,
          pictureUrl: itemPictureUrl,
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
          throw new Error(json.error?.message ?? t.session.updateOrderFailed);
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
        throw new Error(json.error?.message ?? t.session.addOrderFailed);
      }
      return { updated: json.data, isEdit: false };
    },
    onSuccess: ({ updated, isEdit }) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      closeDrawer();
      setActiveTab('TRAY');
      showToast(isEdit ? t.session.updatedSuccess : t.session.addedSuccess);
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
        throw new Error(json.error?.message ?? t.session.deleteOrderFailed);
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      showToast(t.session.deletedSuccess);
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
          pictureUrl: profile.pictureUrl,
          isReady: nextReadyState,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? t.session.toggleStatusFailed);
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
        throw new Error(json.error?.message ?? t.session.confirmCloseTitle);
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      showToast(t.session.statusClosed);
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const reopenSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN_SESSION',
          actorUserId: profile.userId,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: SessionDetailPayload;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? t.session.reopenFailed);
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-session', sessionId], updated);
      showToast(t.session.reopenSuccess);
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const [copyingItemId, setCopyingItemId] = useState<string | null>(null);

  const copyItemMutation = useMutation({
    mutationFn: async (item: OrderItem) => {
      setCopyingItemId(item.id);
      const chosenOptions = item.options.map((opt) => ({
        optionId: opt.optionId ?? undefined,
        optionName: opt.optionName,
        price: opt.price,
      }));

      const payload = {
        sessionId: session.id,
        orderedByUserId: profile.userId,
        recipientName: profile.displayName || t.session.useMyName,
        pictureUrl: profile.pictureUrl ?? null,
        menuId: item.menuId ?? undefined,
        menuName: item.menuName,
        variantName: item.variantName ?? undefined,
        unitPrice: item.unitPrice,
        quantity: 1,
        note: item.note ?? undefined,
        options: chosenOptions,
      };

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
        throw new Error(json.error?.message ?? t.session.addOrderFailed);
      }
      return { data: json.data, menuName: item.menuName };
    },
    onSuccess: ({ data, menuName }) => {
      queryClient.setQueryData(['order-session', sessionId], data);
      showToast(t.session.copyItemSuccess.replace('{name}', menuName));
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
    onSettled: () => {
      setCopyingItemId(null);
    },
  });

  const handleCopyItemToSelf = (item: OrderItem) => {
    if (copyItemMutation.isPending) return;
    copyItemMutation.mutate(item);
  };

  const togglePaidStatus = (name: string) => {
    const isAlreadyPaid = paidRecipients.includes(name);
    const updated = isAlreadyPaid
      ? paidRecipients.filter((n) => n !== name)
      : [...paidRecipients, name];
    setPaidRecipients(updated);
    updateSettlement({ paidRecipients: updated });
  };

  const handleCopyPaymentReminder = async () => {
    const netPayable = summary.netPayableAmount ?? summary.grandTotalAmount;
    const unpaidList = summary.recipientBreakdowns.filter(
      (r) => !paidRecipients.includes(r.recipientName),
    );
    const paidList = summary.recipientBreakdowns.filter((r) =>
      paidRecipients.includes(r.recipientName),
    );

    const lines: string[] = [
      `📢 แจ้งยอดโอนค่าอาหารร้าน: ${storeDisplayName}`,
      `ยอดสุทธิรวม: ${netPayable.toLocaleString('th-TH')} ฿ (ชำระแล้ว ${paidList.length}/${summary.recipientBreakdowns.length} คน)`,
    ];

    if (promptPayId) {
      lines.push(`พร้อมเพย์: ${promptPayId}`);
    }

    if (unpaidList.length > 0) {
      lines.push('------------------------');
      lines.push('⏳ รอชำระ:');
      unpaidList.forEach((r) => {
        const amt = r.finalAmount ?? r.totalAmount;
        lines.push(`• ${r.recipientName}: ${amt.toLocaleString('th-TH')} ฿`);
      });
    }

    if (paidList.length > 0) {
      lines.push('------------------------');
      lines.push('✅ ชำระแล้ว:');
      paidList.forEach((r) => {
        const amt = r.finalAmount ?? r.totalAmount;
        lines.push(`• ${r.recipientName}: ${amt.toLocaleString('th-TH')} ฿`);
      });
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast(t.session.copiedPaymentReminder);
    }
  };

  const handleCopyForMerchant = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summary.merchantCopyText);
      setCopiedMerchant(true);
      setTimeout(() => setCopiedMerchant(false), 2000);
      showToast(t.receipt.copiedStoreSuccess);
    }
  };

  const handleCopyKhunThong = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summary.khunThongCopyText);
      setCopiedKhunThong(true);
      setTimeout(() => setCopiedKhunThong(false), 2000);
      showToast(t.receipt.copiedKhunThongSuccess);
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
      showToast(t.common.copied);
    }
  };

  const handleCopyDirectLink = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/order/${session.id}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast(t.common.copied);
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
    <div className="min-h-screen bg-canvas pb-36">
      <DevPersonaBar hostUserId={session.hostUserId} />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Unified App Header */}
      <AppNavbar
        backHref="/history"
        backLabel={t.nav.orderHistory}
        title={catalog ? getLocalizedText(catalog.store.name, locale) : summary.storeDisplayName}
        subtitle={
          <div className="flex items-center gap-1.5 leading-tight">
            {isOpen ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.history.statusOpen}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                <Lock className="h-2.5 w-2.5 mr-0.5 inline" />
                {t.history.statusClosed}
              </span>
            )}
            <span className="text-ink-muted">•</span>
            <span className="font-mono text-[11px] text-ink-muted tabular-nums">
              {summary.totalItemsCount} {t.common.dishes}
              {formatGrandTotal(summary.grandTotalAmount)
                ? ` • ${formatGrandTotal(summary.grandTotalAmount)}`
                : ''}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-theme border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-2xs transition hover:bg-subtle"
              title={t.session.tapToChangeName}
            >
              <span className="max-w-[80px] sm:max-w-[110px] truncate font-semibold">{profile.displayName}</span>
              <Pencil className="h-3 w-3 text-ink-muted shrink-0" />
            </button>

            <DropdownMenu
              align="right"
              ariaLabel={t.common.viewOptions}
              trigger={
                <button
                  type="button"
                  aria-label={t.common.viewOptions}
                  title={t.common.viewOptions}
                  className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary shadow-2xs transition hover:bg-subtle hover:text-ink cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  label: t.session.openPrintSlip,
                  icon: <Printer className="h-4 w-4" />,
                  href: `/receipt/${session.id}`,
                },
                {
                  label: locale === 'th' ? 'English' : 'Thai',
                  icon: <Globe className="h-4 w-4" />,
                  description: `${locale.toUpperCase()}`,
                  onClick: () => setLocale(locale === 'th' ? 'en' : 'th'),
                },
                {
                  label: t.receipt.copyBillLink,
                  icon: <Copy className="h-4 w-4" />,
                  onClick: handleCopyDirectLink,
                },
                { type: 'separator' },
                {
                  custom: (
                    <DeleteSessionButton
                      sessionId={session.id}
                      hostUserId={session.hostUserId}
                      currentUserId={profile.userId}
                      storeDisplayName={summary.storeDisplayName}
                      variant="menu-item"
                      buttonText={t.deleteModal.title}
                      onSuccess={() => {
                        router.push('/history');
                      }}
                      onError={(err) => showToast(err)}
                    />
                  ),
                },
              ]}
            />
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
              {t.session.readyButton} ({session.readyUsers.length}):
            </span>
            {session.readyUsers.length === 0 ? (
              <span className="text-ink-muted">{t.common.none}</span>
            ) : (
              session.readyUsers.map((u) => (
                <span
                  key={u.userId}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-subtle py-0.5 pl-0.5 pr-2 text-xs font-medium text-ink"
                >
                  <Avatar name={u.displayName} src={u.pictureUrl} size="xs" />
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>{u.displayName}</span>
                </span>
              ))
            )}
          </div>
        </div>
        {isOpen && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-theme border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-950 min-w-0">
              <span className="font-semibold truncate">{t.session.shareToLineGroup}:</span>
              <span className="hidden sm:inline text-[11px] text-emerald-700 shrink-0">
                
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleShareInviteToLine}
                className="h-7 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700 px-2.5"
                title={t.session.shareBillTitle}
              >
                <Share2 className="h-3 w-3 mr-1" />
                <span>{t.session.shareToLineGroup}</span>
              </Button>
              <DropdownMenu
                align="right"
                ariaLabel={t.receipt.copyBillLink}
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1 rounded-theme border border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-2xs transition cursor-pointer"
                    title={t.receipt.copyBillLink}
                  >
                    <Copy className="h-3 w-3" />
                    <span>{t.receipt.copyBillLink}</span>
                  </button>
                }
                items={[
                  {
                    label: t.receipt.copyBillLink,
                    icon: <Copy className="h-4 w-4" />,
                    onClick: handleCopyOrderLink,
                  },
                  {
                    label: t.receipt.copyBillLink,
                    icon: <Globe className="h-4 w-4" />,
                    onClick: handleCopyDirectLink,
                  },
                ]}
              />
            </div>
          </div>
        )}
        {isOpen ? (
          <>
            {/* Segmented Tab Switcher (Catalog vs Group Tray) */}
            <div
              role="tablist"
              aria-label={t.receipt.displayMode}
              className="grid grid-cols-2 gap-1 rounded-theme bg-subtle p-1 border border-hairline"
            >
              <Chip
                role="tab"
                aria-selected={activeTab === 'CATALOG'}
                selected={activeTab === 'CATALOG'}
                onClick={() => setActiveTab('CATALOG')}
                className="w-full text-center"
              >
                {t.session.title}
              </Chip>
              <Chip
                role="tab"
                aria-selected={activeTab === 'TRAY'}
                selected={activeTab === 'TRAY'}
                onClick={() => setActiveTab('TRAY')}
                className="w-full text-center"
              >
                {t.session.orderSummary} ({summary.totalItemsCount})
              </Chip>
            </div>

            {activeTab === 'CATALOG' ? (
              <section className="mt-4 space-y-3" aria-label={t.storeAdmin.menuCatalog}>
                {/* Search & Custom Dish Action */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.session.searchMenuPlaceholder}
                      className="min-h-[44px] h-[44px] w-full rounded-theme border border-hairline bg-surface pl-9 pr-9 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label={t.common.reset}
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
                    <span className="hidden sm:inline">{t.session.addCustomDishShort}</span>
                    <span className="sm:hidden">{t.session.addCustomDishShort}</span>
                  </Button>
                </div>

                {/* Sub-bar: Count & List/Grid Switcher */}
                {catalog && catalog.menus.length > 0 && (
                  <div className="flex items-center justify-between px-0.5 text-xs text-ink-secondary">
                    <span className="truncate pr-2">
                      {searchQuery ? (
                        <>
                          <span className="font-semibold text-ink">{filteredMenus.length}</span> {t.common.items}
                        </>
                      ) : (
                        <>
                          {t.common.all} <span className="font-semibold text-ink">{filteredMenus.length}</span>
                        </>
                      )}
                    </span>

                    {/* View Switcher */}
                    <div
                      role="group"
                      aria-label={t.receipt.displayMode}
                      className="inline-flex shrink-0 items-center rounded-theme border border-hairline bg-subtle p-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleCatalogViewModeChange('LIST')}
                        aria-label={t.session.listView}
                        aria-pressed={catalogViewMode === 'LIST'}
                        title={t.session.listView}
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
                        aria-label={t.session.gridView}
                        aria-pressed={catalogViewMode === 'GRID'}
                        title={t.session.gridView}
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
                            ? `${defaultVariant.price}–${maxVariant.price} ${t.common.baht}`
                            : `${defaultVariant?.price ?? 0} ${t.common.baht}`;

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
                                      {t.storeAdmin.outOfStock}
                                    </Badge>
                                  )}
                                  {menu.status === 'BANNED' && (
                                    <Badge variant="warning" className="text-[10px] py-0.5 px-1.5">
                                      {t.storeAdmin.banned}
                                    </Badge>
                                  )}
                                  {menu.variants.length > 1 && (
                                    <span className="inline-flex items-center rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                      {menu.variants.length} {t.session.variants}
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
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-theme border border-ink bg-ink text-surface shadow-2xs transition group-hover:opacity-90"
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
                            ? `${defaultVariant.price}–${maxVariant.price} ${t.common.baht}`
                            : `${defaultVariant?.price ?? 0} ${t.common.baht}`;

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
                                    {t.storeAdmin.outOfStock}
                                  </Badge>
                                )}
                                {menu.status === 'BANNED' && (
                                  <Badge variant="warning" className="text-[10px] py-0.5">
                                    {t.storeAdmin.banned}
                                  </Badge>
                                )}
                                {menu.variants.length > 1 && (
                                  <span className="inline-flex items-center rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                    {menu.variants.length} {t.session.variants}
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
                                  aria-label={getLocalizedText(menu.name, locale)}
                                  onClick={() => openMenuDrawer(menu)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-ink bg-ink text-surface transition hover:opacity-90 active:scale-90 transition-transform duration-150"
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
                  <Card className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle border border-hairline animate-mascot-float shadow-2xs mb-2">
                      <img src="/brand-mascot.png" alt={t.common.brandName} className="h-7 w-7 object-contain animate-mascot-breathe" />
                    </div>
                    <h3 className="text-base font-semibold text-ink">
                      searchQuery ? t.common.none : t.session.addCustomDish
                    </h3>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {searchQuery
                        ? '{t.session.emptyTrayHint}'
                        : '{t.session.emptyTrayHint}'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={() => setSearchQuery('')}
                        >
                          {t.common.reset}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={openCustomItemDrawer}
                      >
                        <Plus className="h-4 w-4" />
                        {t.session.addCustomDish}
                      </Button>
                    </div>
                  </Card>
                )}
              </section>
            ) : (
              /* Group Tray Tab (while OPEN) */
              <section className="mt-4 space-y-3" aria-label={t.session.orderSummary}>
                {session.items.length === 0 ? (
                  <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle border border-hairline animate-mascot-float shadow-xs">
                      <img src="/brand-mascot.png" alt={t.common.brandName} className="h-9 w-9 object-contain animate-mascot-breathe" />
                    </div>
                    <p className="text-sm text-ink-secondary">
                      {t.session.emptyTrayHint}
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
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-subtle py-0.5 pl-0.5 pr-2 text-[11px] font-semibold text-ink">
                                <Avatar name={item.recipientName} src={item.pictureUrl} size="xs" />
                                <span>{item.recipientName}</span>
                              </span>
                              {(() => {
                                const isItemUserReady = session.readyUsers.some(
                                  (u) =>
                                    u.userId === item.orderedByUserId ||
                                    u.displayName === item.recipientName,
                                );
                                return isItemUserReady ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                                    {t.session.readyShort}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700">
                                    <Clock className="h-2.5 w-2.5 text-amber-500" />
                                    {t.session.selectingShort}
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
                                {t.session.note}: {item.note}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="mr-1 font-mono text-sm font-semibold text-ink tabular-nums">
                              {lineTotal.toLocaleString('th-TH')} {t.common.baht}
                            </span>
                            <button
                              type="button"
                              aria-label={`${t.session.copyItemToSelf}: ${title}`}
                              onClick={() => handleCopyItemToSelf(item)}
                              disabled={copyItemMutation.isPending}
                              className={cn(
                                "inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-subtle hover:border-ink transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                                copyingItemId === item.id && "border-ink bg-subtle"
                              )}
                              title={t.session.copyItemToSelf}
                            >
                              {copyingItemId === item.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-ink" />
                              ) : (
                                <CopyPlus className="h-3.5 w-3.5 text-ink-muted" />
                              )}
                              <span className="hidden xs:inline">
                                {copyingItemId === item.id ? t.common.pleaseWait : t.session.copyItemToSelf}
                              </span>
                            </button>
                            {canMutate && (
                              <>
                                <button
                                  type="button"
                                  aria-label={`${t.common.edit}: ${title}`}
                                  onClick={() => openEditItemDrawer(item)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-hairline text-ink-secondary transition hover:bg-subtle hover:text-ink"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`${t.common.delete}: ${title}`}
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: t.session.deleteOrderTitle,
                                      description: t.session.deleteOrderDesc,
                                      confirmText: t.common.delete,
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
          <section className="space-y-4" aria-label={t.session.postCloseSummary}>
            {/* Primary Action Bar: LINE Share + Quick Export Menu */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleShareToLine}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                {t.session.shareBillTitle}
              </Button>

              {isHost && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: t.session.reopenConfirmTitle,
                      description: t.session.reopenConfirmDesc,
                      confirmText: t.session.reopenRoundButton,
                      variant: 'primary',
                      onConfirm: () => {
                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                        reopenSessionMutation.mutate();
                      },
                    });
                  }}
                  loading={reopenSessionMutation.isPending}
                  className="gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shrink-0"
                  title={t.session.reopenRoundButton}
                >
                  <RefreshCw className="h-4 w-4 text-amber-700" />
                  <span className="hidden sm:inline">{t.session.reopenRoundButton}</span>
                </Button>
              )}

              <DropdownMenu
                align="right"
                ariaLabel={t.session.quickCopyOptions}
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="shrink-0 gap-1.5 px-3"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{t.session.quickCopy}</span>
                  </Button>
                }
                items={[
                  {
                    label: t.session.copyStoreText,
                    icon: <UtensilsCrossed className="h-4 w-4" />,
                    onClick: handleCopyForMerchant,
                  },
                  {
                    label: t.session.copyKhunThongText,
                    icon: <Coins className="h-4 w-4 text-amber-600" />,
                    onClick: handleCopyKhunThong,
                  },
                  {
                    label: t.session.copyPaymentReminder,
                    icon: <Copy className="h-4 w-4 text-emerald-600" />,
                    onClick: handleCopyPaymentReminder,
                  },
                  { type: 'separator' },
                  {
                    label: t.session.feeSettings,
                    icon: <UtensilsCrossed className="h-4 w-4" />,
                    onClick: () => setIsFeeSettingsOpen(true),
                  },
                  {
                    label: t.session.openPrintSlip,
                    icon: <Printer className="h-4 w-4" />,
                    href: `/receipt/${session.id}`,
                  },
                ]}
              />
            </div>

            {/* Session Date-Time & Status Bar */}
            <div className="flex items-center justify-between text-xs text-ink-secondary px-1">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-ink-muted" />
                <span>{t.session.dateTime}: {formatThaiDateTime(session.closedAt ?? session.createdAt)}</span>
              </span>
              <span className="font-mono text-[11px] text-ink-muted">#{session.id.slice(0, 8).toUpperCase()}</span>
            </div>

            {/* Toggle: Grouped View vs Individual Breakdown */}
            <div className="grid grid-cols-2 gap-1 rounded-theme bg-subtle p-1 border border-hairline">
              <Chip
                selected={closedViewMode === 'GROUPED'}
                onClick={() => setClosedViewMode('GROUPED')}
                className="w-full text-center"
              >
                {t.session.groupByMenu} ({summary.groupedItems.length})
              </Chip>
              <Chip
                selected={closedViewMode === 'INDIVIDUAL'}
                onClick={() => setClosedViewMode('INDIVIDUAL')}
                className="w-full text-center"
              >
                {t.session.groupByRecipient} ({summary.recipientBreakdowns.length})
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
                            {t.session.note}: {group.note}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-secondary">
                          <span className="font-medium text-ink-muted">{t.session.orderedBy}:</span>
                          {group.recipients.map((r, rIdx) => (
                            <span
                              key={`${r.recipientName}-${rIdx}`}
                              className="inline-flex items-center gap-1 rounded-full border border-hairline bg-subtle py-0.5 pl-0.5 pr-2 text-[11px] text-ink"
                            >
                              <Avatar name={r.recipientName} src={r.pictureUrl} size="xs" />
                              <span>
                                {r.quantity > 1
                                  ? `${r.recipientName} (${r.quantity})`
                                  : r.recipientName}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-mono tabular-nums">
                        <span className="inline-block border border-hairline rounded-theme bg-subtle px-2 py-0.5 text-xs font-bold text-ink">
                          x {group.totalQuantity}
                        </span>
                        {group.totalPrice > 0 && (
                          <p className="mt-1 text-xs text-ink-secondary">
                            {group.totalPrice.toLocaleString('th-TH')} {t.common.baht}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Payment Tracking Dashboard Card */}
                {(() => {
                  const totalNet = summary.netPayableAmount ?? summary.grandTotalAmount;
                  const totalRecipients = summary.recipientBreakdowns.length;
                  const paidCount = summary.recipientBreakdowns.filter((r) =>
                    paidRecipients.includes(r.recipientName),
                  ).length;
                  const paidAmount = summary.recipientBreakdowns
                    .filter((r) => paidRecipients.includes(r.recipientName))
                    .reduce((sum, r) => sum + (r.finalAmount ?? r.totalAmount), 0);
                  const progressPct =
                    totalNet > 0 ? Math.round((paidAmount / totalNet) * 100) : 0;

                  return (
                    <Card className="p-4 space-y-3 bg-canvas border border-hairline">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-bold text-ink">{t.session.paymentTracker}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full tabular-nums">
                          {t.session.paidSummary
                            .replace('{paid}', String(paidCount))
                            .replace('{total}', String(totalRecipients))}{' '}
                          ({progressPct}%)
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-subtle overflow-hidden border border-hairline">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-ink-secondary">
                        <span>
                          {t.session.paid}:{' '}
                          <strong className="font-mono text-ink tabular-nums">
                            {paidAmount.toLocaleString('th-TH')} {t.common.baht}
                          </strong>
                        </span>
                        <span>
                          {t.session.remainingAmount}:{' '}
                          <strong className="font-mono text-chili tabular-nums">
                            {Math.max(0, totalNet - paidAmount).toLocaleString('th-TH')}{' '}
                            {t.common.baht}
                          </strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCopyPaymentReminder}
                          className="flex-1 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          <span>{t.session.copyPaymentReminder}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsFeeSettingsOpen(true)}
                          className="text-xs shrink-0"
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5 mr-1" />
                          <span>{t.session.feeSettings}</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })()}

                {/* Individual Recipient Itemized Breakdown */}
                <Card className="divide-y divide-hairline overflow-hidden">
                  {summary.recipientBreakdowns.map((person) => {
                    const isPersonPaid = paidRecipients.includes(person.recipientName);
                    const payableAmount = person.finalAmount ?? person.totalAmount;
                    const hasAdjustments =
                      Boolean(person.deliveryFeeShare && person.deliveryFeeShare > 0) ||
                      Boolean(person.discountShare && person.discountShare > 0);

                    return (
                      <div key={person.recipientName} className="px-4 py-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={person.recipientName} src={person.pictureUrl} size="sm" />
                            <div className="truncate">
                              <span className="text-sm font-semibold text-ink block truncate">
                                {person.recipientName}
                              </span>
                              {hasAdjustments && (
                                <span className="text-[11px] text-ink-muted">
                                  {t.session.foodSubtotal}: {person.totalAmount}฿
                                  {person.deliveryFeeShare ? ` +ค่าส่ง ${person.deliveryFeeShare}฿` : ''}
                                  {person.discountShare ? ` -ส่วนลด ${person.discountShare}฿` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-base font-bold text-ink tabular-nums block">
                              {formatPrice(payableAmount, {
                                isGrandTotalZero: summary.grandTotalAmount === 0,
                              })}
                            </span>
                          </div>
                        </div>

                        <ul className="space-y-1 pl-1">
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
                                {formatPrice(item.lineTotal, {
                                  isGrandTotalZero: summary.grandTotalAmount === 0,
                                  unpricedFallback: '-',
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-hairline">
                          <button
                            type="button"
                            onClick={() => {
                              if (!promptPayId) {
                                setIsFeeSettingsOpen(true);
                                showToast(t.session.promptPayPhoneOrId);
                                return;
                              }
                              setPromptPayModalData({
                                isOpen: true,
                                recipientName: person.recipientName,
                                amount: payableAmount,
                              });
                            }}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-subtle transition active:scale-95"
                          >
                            <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{t.session.payWithPromptPay}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => togglePaidStatus(person.recipientName)}
                            className={cn(
                              'inline-flex min-h-[36px] items-center gap-1.5 rounded-theme px-3 py-1 text-xs font-semibold transition active:scale-95',
                              isPersonPaid
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                : 'border border-hairline bg-subtle text-ink-secondary hover:text-ink hover:bg-surface'
                            )}
                          >
                            {isPersonPaid ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>{t.session.paid}</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-ink-muted" />
                                <span>{t.session.unpaid}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* Quick Copy Hub (Merchant & KhunThong with Tabs) */}
            <Card className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
                <span className="text-xs font-semibold text-ink">{t.session.readyToSendText}</span>

                {/* Tab Switcher: Merchant vs KhunThong */}
                <div className="inline-flex rounded-theme border border-hairline bg-subtle p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setClosedCopyTab('MERCHANT')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-theme transition cursor-pointer',
                      closedCopyTab === 'MERCHANT'
                        ? 'bg-surface font-semibold text-ink shadow-2xs'
                        : 'text-ink-secondary hover:text-ink'
                    )}
                  >
                    <UtensilsCrossed className="h-3 w-3" />
                    <span>{t.session.sendToMerchant}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosedCopyTab('KHUNTHONG')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-theme transition cursor-pointer',
                      closedCopyTab === 'KHUNTHONG'
                        ? 'bg-surface font-semibold text-amber-900 shadow-2xs'
                        : 'text-ink-secondary hover:text-ink'
                    )}
                  >
                    <Coins className="h-3 w-3 text-amber-600" />
                    <span>{t.session.sendToKhunThong}</span>
                  </button>
                </div>
              </div>

              {/* Compact Preview Box with max-height and custom scrollbar */}
              <div className="relative">
                <pre
                  className={cn(
                    'max-h-32 overflow-y-auto whitespace-pre-wrap rounded-theme border p-3 font-mono text-[11px] leading-relaxed transition-colors',
                    closedCopyTab === 'MERCHANT'
                      ? 'border-hairline bg-canvas text-ink'
                      : 'border-amber-200 bg-amber-50/50 text-amber-950'
                  )}
                >
                  {closedCopyTab === 'MERCHANT'
                    ? summary.merchantCopyText
                    : summary.khunThongCopyText}
                </pre>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={
                    closedCopyTab === 'MERCHANT'
                      ? handleCopyForMerchant
                      : handleCopyKhunThong
                  }
                  className={cn(
                    'flex-1 text-xs font-semibold',
                    closedCopyTab === 'KHUNTHONG' &&
                      'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  )}
                >
                  {closedCopyTab === 'MERCHANT' ? (
                    copiedMerchant ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                        <span>{t.session.copiedStoreText}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        <span>{t.session.copyForMerchant}</span>
                      </>
                    )
                  ) : copiedKhunThong ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                      <span>{t.session.copiedKhunThongText}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      <span>{t.session.copyKhunThongText}</span>
                    </>
                  )}
                </Button>

                <Link
                  href={`/receipt/${session.id}`}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-theme border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink-secondary hover:text-ink hover:bg-subtle transition shadow-2xs shrink-0"
                  title={t.session.openPrintSlip}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.session.printReceipt}</span>
                </Link>
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
          aria-label={t.session.addDishModalSub}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-theme border border-hairline bg-surface p-5 shadow-theme animate-paper-slide">
            <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
              <div>
                <h2 className="text-base font-bold text-ink">
                  {editingItem
                    ? t.session.editItemDialogTitle.replace('{name}', selectedMenu ? getLocalizedText(selectedMenu.name, locale) : customMenuName)
                    : selectedMenu
                      ? getLocalizedText(selectedMenu.name, locale)
                      : t.session.addCustomDish}
                </h2>
                <p className="text-xs text-ink-secondary">
                  {t.session.addDishModalSub}
                </p>
              </div>
              <button
                type="button"
                aria-label={t.common.close}
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
                    <div className="w-full flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-ink">
                        <span>
                          {t.session.dishNameLabel} <span className="text-red-500 font-bold">*</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const dish = getRandomDish(customMenuName);
                            setCustomMenuName(dish.nameTh);
                            showToast(`${t.session.dishRandomized}: ${dish.nameTh}`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-chili hover:text-chili-hover transition active:scale-95"
                          title={t.session.randomDish}
                        >
                          <Dices className="h-3.5 w-3.5" />
                          <span>{t.session.randomDish}</span>
                        </button>
                      </div>
                      <input
                        required
                        value={customMenuName}
                        onChange={(e) => setCustomMenuName(e.target.value)}
                        placeholder={t.session.dishNamePlaceholder}
                        className="w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border border-hairline hover:border-ink-secondary rounded-theme transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink"
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      label={t.session.priceLabel}
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
                  <span className="block text-xs font-semibold text-ink">{t.session.selectVariant}</span>
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
                            {variant.price} {t.common.baht}
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
                    {t.session.optionsMultiple}
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
                            +{opt.price} {t.common.baht}
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
                  <label className="block text-xs font-semibold text-ink">{t.session.quantityDishes}</label>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    className="w-36 justify-between"
                  />
                </div>

                {!showCustomRecipient ? (
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-subtle/50 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        name={recipientName.trim() || profile.displayName}
                        src={profile.pictureUrl}
                        size="xs"
                      />
                      <span className="text-ink-secondary truncate">
                        {t.session.orderUnderName}:{' '}
                        <strong className="text-ink font-semibold">
                          {recipientName.trim() || profile.displayName}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomRecipient(true)}
                      className="font-semibold text-chili hover:underline"
                    >
                      {t.session.orderForOthers}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-hairline bg-subtle/40 p-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-ink">
                        {t.session.orderForWhom}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientName(profile.displayName);
                          setShowCustomRecipient(false);
                        }}
                        className="text-[11px] font-medium text-ink-muted hover:text-ink hover:underline"
                      >
                        {t.session.useMyName} ({profile.displayName})
                      </button>
                    </div>
                    <Input
                      autoFocus
                      placeholder={t.session.orderForOthersPlaceholder}
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
                  label={t.session.noteToStore}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.session.noteToStorePlaceholder}
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
                <span>{editingItem ? t.session.saveEditButton : t.session.addToGroupBill}</span>
                <span className="font-mono font-bold tabular-nums">
                  {drawerPreviewTotal.toLocaleString('th-TH')} {t.common.baht}
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
        <div className="fixed bottom-0 left-0 right-0 z-30 transform-gpu translate-z-0 will-change-transform border-t border-hairline bg-surface/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-theme">
          <div className="mx-auto flex max-w-lg flex-col gap-2.5">
            {/* Top row: Summary info & user readiness */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-xs text-ink-muted shrink-0">{t.session.totalOfPerson}</span>
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(true)}
                  className="inline-flex items-center gap-1 font-bold text-xs text-ink underline decoration-dotted decoration-ink/40 hover:text-chili transition cursor-pointer min-w-0"
                  title={t.session.tapToChangeName}
                >
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">{profile.displayName}</span>
                  <Pencil className="h-2.5 w-2.5 text-ink-muted shrink-0" />
                </button>
                <span className="text-xs text-ink-secondary shrink-0">({myItems.length} {t.common.items})</span>
                {isCurrentUserReady ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0 animate-soft-pulse">
                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                    {t.session.readyShort}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
                    {t.session.selectingShort}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 shrink-0 text-right">
                <span className="text-[11px] text-ink-muted">{t.session.sumLabel}</span>
                <span className="font-mono text-base font-bold text-ink tabular-nums">
                  {formatPrice(myTotalAmount, {
                    isGrandTotalZero: summary.grandTotalAmount === 0,
                    zeroFallback: `0 ${t.common.baht}`,
                  })}
                </span>
              </div>
            </div>

            {/* Bottom row: Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isCurrentUserReady ? 'secondary' : 'primary'}
                size="md"
                disabled={toggleReadyMutation.isPending}
                loading={toggleReadyMutation.isPending}
                onClick={() => toggleReadyMutation.mutate(!isCurrentUserReady)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isCurrentUserReady ? t.common.cancel : t.session.readyShort}
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
                      title: t.session.confirmCloseTitle,
                      description: t.session.confirmCloseDesc.replace("{store}", summary.storeDisplayName),
                      confirmText: t.session.closeBillButton,
                      variant: 'danger',
                      onConfirm: () => {
                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                        closeSessionMutation.mutate();
                      },
                    });
                  }}
                  className="shrink-0"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {t.session.closeBillButton}
                </Button>
              )}
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
          showToast(t.session.nameUpdatedToast.replace("{name}", newName));
        }}
        currentName={profile.displayName}
        canClose={true}
      />

      <PromptPayQrModal
        isOpen={promptPayModalData.isOpen}
        onClose={() => setPromptPayModalData((prev) => ({ ...prev, isOpen: false }))}
        promptPayId={promptPayId || '0000000000'}
        totalAmount={promptPayModalData.amount}
        modalTitle={`${t.session.payWithPromptPay}: ${promptPayModalData.recipientName}`}
      />

      {isFeeSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-theme border border-hairline bg-surface p-5 shadow-theme space-y-4 animate-paper-slide">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-bold text-ink">{t.session.feeSettings}</h3>
              <button
                type="button"
                aria-label={t.common.close}
                onClick={() => setIsFeeSettingsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-hairline bg-subtle text-ink-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t.session.deliveryFee} ({t.common.baht})
                </label>
                <input
                  type="number"
                  min={0}
                  value={deliveryFee || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setDeliveryFee(val);
                    updateSettlement({ deliveryFee: val });
                  }}
                  placeholder="0"
                  className="w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border border-hairline rounded-theme font-mono tabular-nums focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t.session.packagingFee} ({t.common.baht})
                </label>
                <input
                  type="number"
                  min={0}
                  value={packagingFee || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setPackagingFee(val);
                    updateSettlement({ packagingFee: val });
                  }}
                  placeholder="0"
                  className="w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border border-hairline rounded-theme font-mono tabular-nums focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t.session.discount} ({t.common.baht})
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setDiscount(val);
                    updateSettlement({ discount: val });
                  }}
                  placeholder="0"
                  className="w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border border-hairline rounded-theme font-mono tabular-nums focus:border-ink focus:outline-none text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t.session.splitMethod}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMethod('EQUAL');
                      updateSettlement({ splitMethod: 'EQUAL' });
                    }}
                    className={cn(
                      'min-h-[44px] rounded-theme border text-xs font-semibold transition px-2',
                      splitMethod === 'EQUAL'
                        ? 'border-ink bg-ink text-surface'
                        : 'border-hairline bg-surface text-ink hover:bg-subtle'
                    )}
                  >
                    {t.session.splitEqual}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMethod('PROPORTIONAL');
                      updateSettlement({ splitMethod: 'PROPORTIONAL' });
                    }}
                    className={cn(
                      'min-h-[44px] rounded-theme border text-xs font-semibold transition px-2',
                      splitMethod === 'PROPORTIONAL'
                        ? 'border-ink bg-ink text-surface'
                        : 'border-hairline bg-surface text-ink hover:bg-subtle'
                    )}
                  >
                    {t.session.splitProportional}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t.session.promptPayPhoneOrId}
                </label>
                <input
                  type="text"
                  value={promptPayId}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setPromptPayId(val);
                    updateSettlement({ promptPayId: val });
                    try {
                      localStorage.setItem('promptpay_account_target', val);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={t.session.promptPayPhonePlaceholder}
                  className="w-full min-h-[44px] h-[44px] px-3.5 bg-surface text-ink text-[16px] border border-hairline rounded-theme font-mono focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsFeeSettingsOpen(false)}
                className="w-full"
              >
                {t.common.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
