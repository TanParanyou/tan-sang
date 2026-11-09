'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Copy,
  Check,
  Share2,
  RotateCcw,
  Sparkles,
  Clipboard,
  ArrowUpDown,
  Info,
} from 'lucide-react';
import { AppNavbar } from '@/components/shared/app-navbar';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { PromptPayQrModal } from '@/components/shared/promptpay-qr-modal';
import { Button, Toast } from '@/components/ui';
import { useClipboardCopy } from '@/lib/hooks/use-clipboard-copy';
import { useDragReorder } from '@/lib/hooks/use-drag-reorder';
import { parsePromptPayTarget } from '@/lib/utils/promptpay';
import { cn } from '@/lib/utils/cn';
import { siteConfig } from '@/config/site';
import { useI18n } from '@/lib/i18n/i18n-context';
import { BillInfoSection } from './components/bill-info-section';
import { BillLedgerSection } from './components/bill-ledger-section';
import { MemberItemRow } from './components/member-item-row';
import { PromptPaySection } from './components/promptpay-section';
import { QuickPasteModal } from './components/quick-paste-modal';
import {
  SharedDishesSection,
  type SharedDishDraft,
} from './components/shared-dishes-section';
import type { SplitItem, SplitMethod, SplitMemberResult } from './split-calculator.schema';
import {
  calculateSplitBill,
  formatSplitBillCopyText,
  formatIndividualPaymentText,
  reorderArray,
  sortSplitItems,
  encodeSplitBillToUrl,
  decodeSplitBillFromUrl,
} from './split-calculator.service';

const SAMPLE_DEMO_ITEMS: SplitItem[] = [
  { id: '1', name: 'กัส', price: 79.5 },
  { id: '2', name: 'ตาล', price: 79.5 },
  { id: '3', name: 'เอฟ', price: 79.5 },
  { id: '4', name: 'บอส', price: 79.5 },
  { id: '5', name: 'โก', price: 59.5 },
  { id: '6', name: 'ชล', price: 59.5 },
  { id: '7', name: 'ฟิม', price: 59.5 },
  { id: '8', name: 'มีน', price: 79.5 },
];

const SAMPLE_DEMO_SHARED: SharedDishDraft[] = [
  {
    id: 'demo-shared-1',
    name: 'ไก่ทอดเกาหลี (จานกลาง)',
    price: 120,
    memberIds: [],
  },
];

const INITIAL_BLANK_ITEMS: Array<{ id: string; name: string; price: number | '' }> = [
  { id: '1', name: '', price: '' },
  { id: '2', name: '', price: '' },
];

export function SplitCalculatorClient() {
  const { t } = useI18n();
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('PROPORTIONAL');
  const [promptPayAccount, setPromptPayAccount] = useState<string>('');
  const [items, setItems] = useState<Array<{ id: string; name: string; price: number | '' }>>(
    INITIAL_BLANK_ITEMS,
  );
  const [sharedItems, setSharedItems] = useState<SharedDishDraft[]>([]);
  const [paidMemberIds, setPaidMemberIds] = useState<string[]>([]);

  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Reusable Hooks
  const { copy: copyToClipboard, isCopied, toastMessage, notify } = useClipboardCopy();

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragReorder({
    onReorder: (from, to) => setItems((prev) => reorderArray(prev, from, to)),
  });

  // Restore state from URL query if present (shareable link support)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const encodedData = params.get('d');
      if (encodedData) {
        const decoded = decodeSplitBillFromUrl(encodedData);
        if (decoded && decoded.items && decoded.items.length > 0) {
          setItems(decoded.items);
          setDeliveryFeeInput(decoded.deliveryFee > 0 ? decoded.deliveryFee.toString() : '');
          setDiscountInput(decoded.discount > 0 ? decoded.discount.toString() : '');
          if (decoded.splitMethod) setSplitMethod(decoded.splitMethod);
          if (decoded.promptPay) setPromptPayAccount(decoded.promptPay);
          if (decoded.sharedItems && decoded.sharedItems.length > 0) {
            setSharedItems(decoded.sharedItems);
          }
        }
      }
    } catch {
      // Ignore URL parsing errors and keep defaults
    }
  }, []);

  // Compute live calculation
  const calculationResult = useMemo(() => {
    const deliveryFee = parseFloat(deliveryFeeInput) || 0;
    const discount = parseFloat(discountInput) || 0;
    const sanitizedItems: SplitItem[] = items.map((it, idx) => ({
      id: it.id,
      name: it.name.trim() || `${t.split.memberPlaceholder} ${idx + 1}`,
      price: typeof it.price === 'number' ? it.price : 0,
    }));

    const sanitizedSharedItems = sharedItems
      .filter((si) => typeof si.price === 'number' && si.price > 0)
      .map((si) => ({
        id: si.id,
        name: si.name.trim() || 'ของกินส่วนกลาง',
        price: typeof si.price === 'number' ? si.price : 0,
        memberIds: si.memberIds,
      }));

    return calculateSplitBill({
      deliveryFee,
      discount,
      items: sanitizedItems,
      sharedItems: sanitizedSharedItems,
      splitMethod,
      roundToInteger: true,
    });
  }, [deliveryFeeInput, discountInput, items, sharedItems, splitMethod, t.split.memberPlaceholder]);

  const parsedPromptPay = useMemo(() => {
    return parsePromptPayTarget(promptPayAccount);
  }, [promptPayAccount]);

  const handleAddItem = () => {
    const newId = Date.now().toString();
    setItems((prev) => [
      ...prev,
      { id: newId, name: `${t.split.memberPlaceholder} ${prev.length + 1}`, price: '' },
    ]);
    setTimeout(() => {
      document.getElementById(`price-input-${newId}`)?.focus();
    }, 50);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      notify(t.common.error);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    setPaidMemberIds((prev) => prev.filter((mid) => mid !== id));
  };

  const handleItemChange = (id: string, field: 'name' | 'price', value: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'name') {
          return { ...it, name: value };
        }
        const numeric = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
        return { ...it, price: numeric };
      }),
    );
  };

  // Shared Dishes Handlers
  const handleAddSharedDish = () => {
    const newId = `shared-${Date.now()}`;
    setSharedItems((prev) => [
      ...prev,
      { id: newId, name: '', price: '', memberIds: [] },
    ]);
  };

  const handleRemoveSharedDish = (id: string) => {
    setSharedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateSharedDish = (
    id: string,
    field: 'name' | 'price' | 'memberIds',
    value: string | number | '' | string[],
  ) => {
    setSharedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  // Payment Tracking Handlers
  const handleTogglePaid = (memberId: string) => {
    setPaidMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const handleMarkAllPaid = () => {
    setPaidMemberIds(calculationResult.members.map((m) => m.id));
    notify(t.split.paid);
  };

  const handleResetPaid = () => {
    setPaidMemberIds([]);
    notify(t.split.resetPaid);
  };

  const handleCopyIndividualReminder = async (member: SplitMemberResult) => {
    const text = formatIndividualPaymentText(member, promptPayAccount);
    await copyToClipboard(
      text,
      t.split.copiedIndividualDebt.replace('{name}', member.name),
    );
  };

  const handleSort = (type: 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC') => {
    setItems((prev) => sortSplitItems(prev, type));
    if (type === 'PRICE_DESC') notify(t.split.sortHighest);
    if (type === 'PRICE_ASC') notify(t.split.sortLowest);
    if (type === 'NAME_ASC') notify(t.split.sortByPrice);
  };

  const handleReset = () => {
    setDeliveryFeeInput('');
    setDiscountInput('');
    setSplitMethod('PROPORTIONAL');
    setPromptPayAccount('');
    setItems([
      { id: '1', name: '', price: '' },
      { id: '2', name: '', price: '' },
    ]);
    setSharedItems([]);
    setPaidMemberIds([]);
    notify(t.common.reset);
  };

  const handleLoadDemo = () => {
    setDeliveryFeeInput('12');
    setDiscountInput('83');
    setSplitMethod('PROPORTIONAL');
    setItems(SAMPLE_DEMO_ITEMS);
    setSharedItems(SAMPLE_DEMO_SHARED);
    setPaidMemberIds(['1', '2']);
    setPromptPayAccount('0812345678');
    notify(t.split.demoSampleBtn);
  };

  const handleImportQuickPaste = (parsed: Array<{ name: string; price: number }>) => {
    const newItems = parsed.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: p.name,
      price: p.price,
    }));
    setItems(newItems);
    notify(`${t.common.save} (${newItems.length})`);
  };

  const handleCopyText = async () => {
    const text = formatSplitBillCopyText(calculationResult, {
      promptPayAccount: promptPayAccount.trim() || undefined,
      paidMemberIds,
    });
    await copyToClipboard(text, t.split.copiedResult);
  };

  const getBaseShareUrl = (): string => {
    if (typeof window === 'undefined') return siteConfig.url;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return siteConfig.url || window.location.origin;
    }
    if (window.location.hostname.includes('liff.line.me')) {
      return siteConfig.url;
    }
    return window.location.origin;
  };

  const handleShareLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      const validItems = items.filter(
        (it) => it.name.trim() !== '' || (typeof it.price === 'number' && it.price > 0),
      );
      const itemsToShare = validItems.length > 0 ? validItems : items;

      const encoded = encodeSplitBillToUrl({
        deliveryFee: parseFloat(deliveryFeeInput) || 0,
        discount: parseFloat(discountInput) || 0,
        splitMethod,
        promptPay: promptPayAccount.trim(),
        items: itemsToShare,
        sharedItems,
      });

      const baseUrl = getBaseShareUrl();
      const shareUrl = `${baseUrl}/harn?d=${encoded}`;

      // 1. Try Native Web Share API first
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: t.split.sharePromptTitle,
            text: `${t.split.calculatedResult} (${calculationResult.members.length}): ${calculationResult.grandTotal} ${t.common.baht}`,
            url: shareUrl,
          });
          setIsLinkCopied(true);
          notify(t.split.sharedSuccess);
          setTimeout(() => setIsLinkCopied(false), 2000);
          return;
        } catch (shareErr: unknown) {
          if (shareErr instanceof Error && shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Fallback to Clipboard Copy
      const success = await copyToClipboard(shareUrl, t.split.copiedShareLink);
      if (success) {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      }
    } catch {
      notify(t.split.sharedFailed);
    }
  };

  const handleOpenQrModal = () => {
    if (!parsedPromptPay) {
      notify(t.split.promptPayInputPlaceholder);
      document.getElementById('promptpay-input')?.focus();
      return;
    }
    setIsQrModalOpen(true);
  };

  // Map member results to PromptPay QR item options
  const qrItemOptions = useMemo(() => {
    return calculationResult.members.map((m) => ({
      id: m.id,
      name: m.name,
      amount: m.finalPrice,
    }));
  }, [calculationResult.members]);

  const memberSummaryForShared = useMemo(() => {
    return items.map((it, idx) => ({
      id: it.id,
      name: it.name.trim() || `${t.split.memberPlaceholder} ${idx + 1}`,
    }));
  }, [items, t.split.memberPlaceholder]);

  return (
    <div className="min-h-screen bg-canvas pb-32">
      <DevPersonaBar />
      <AppNavbar
        title={t.landing.harnCardTitle}
        subtitle={t.split.subtitle}
        backHref="/"
        backLabel={t.nav.home}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-theme px-2.5 text-xs font-medium text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.common.reset}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-theme px-2.5 text-xs font-semibold text-chili bg-chili/10 hover:bg-chili/15 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.split.demoSampleBtn}</span>
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-lg px-2.5 sm:px-4 pt-4 space-y-4 w-full box-border overflow-x-hidden">
        {/* Unified Calculation Paper Sheet */}
        <div className="rounded-xl border border-hairline bg-surface shadow-xs divide-y divide-hairline overflow-hidden w-full">
          {/* Section 1: Bill Info (Delivery, Discount) */}
          <BillInfoSection
            deliveryFeeInput={deliveryFeeInput}
            onDeliveryFeeChange={setDeliveryFeeInput}
            discountInput={discountInput}
            onDiscountChange={setDiscountInput}
            splitMethod={splitMethod}
            onSplitMethodChange={setSplitMethod}
            netDiscount={calculationResult.netDiscount}
          />

          {/* Section 2: Shared Dishes (ของกินส่วนกลาง) */}
          <SharedDishesSection
            sharedItems={sharedItems}
            allMembers={memberSummaryForShared}
            onAddSharedDish={handleAddSharedDish}
            onRemoveSharedDish={handleRemoveSharedDish}
            onUpdateSharedDish={handleUpdateSharedDish}
          />

          {/* Section 3: Member List */}
          <section aria-labelledby="members-heading" className="p-3 sm:p-5 space-y-3 w-full box-border">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="members-heading" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  {t.split.memberListSection}
                </h2>
                <p className="text-sm font-semibold text-ink">
                  {items.length} {t.split.peopleCount}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5">
                {/* Toggle All Details (ดูข้อมูลทุกคน) */}
                <button
                  type="button"
                  onClick={() => setShowAllDetails((prev) => !prev)}
                  className={cn(
                    'inline-flex h-[34px] items-center gap-1 rounded-theme px-2.5 text-xs font-medium border transition-colors shrink-0 box-border',
                    showAllDetails
                      ? 'bg-ink text-surface border-ink'
                      : 'bg-subtle hover:bg-hairline text-ink-secondary border-hairline',
                  )}
                  title={showAllDetails ? t.split.hideAllDetails : t.split.toggleAllDetails}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {showAllDetails ? t.split.hideAllDetails : t.split.toggleAllDetails}
                  </span>
                </button>

                <div className="relative inline-flex items-center">
                  <select
                    aria-label={t.split.sortByPrice}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSort(e.target.value as 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC');
                        e.target.value = '';
                      }
                    }}
                    className="appearance-none h-[34px] pl-2.5 pr-7 text-xs font-semibold text-ink bg-subtle hover:bg-hairline border border-hairline rounded-theme focus:outline-none cursor-pointer leading-[32px] box-border"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {t.split.sortByPrice}
                    </option>
                    <option value="PRICE_DESC">{t.split.sortHighest}</option>
                    <option value="PRICE_ASC">{t.split.sortLowest}</option>
                  </select>
                  <ArrowUpDown className="absolute right-2 h-3.5 w-3.5 text-ink-muted pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuickPasteOpen(true)}
                  className="inline-flex h-[34px] items-center gap-1 rounded-theme px-2.5 text-xs font-semibold text-chili border border-chili/30 bg-chili/5 hover:bg-chili/10 transition-colors shrink-0 box-border"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>{t.split.quickPasteBtn}</span>
                </button>
              </div>
            </div>

            {/* Table Header: Tabular alignment with MemberItemRow */}
            <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 pt-1 border-b border-hairline pb-1.5 gap-1 sm:gap-2 w-full select-none">
              <span className="w-6 sm:w-7 text-center shrink-0">#</span>
              <span className="flex-1 min-w-0 pl-1">{t.split.memberPlaceholder}</span>
              <span className="w-[76px] sm:w-[90px] text-right pr-2 shrink-0">{t.split.rawPriceLabel}</span>
              <span className="w-[64px] sm:w-[76px] text-center shrink-0 text-chili">{t.split.netToPay}</span>
              <span className="w-6 sm:w-7 shrink-0" aria-hidden="true" />
            </div>

            {/* Members Rows */}
            <div className="divide-y divide-hairline">
              {calculationResult.members.map((member, index) => {
                const rawItem = items.find((it) => it.id === member.id);
                const priceVal = rawItem?.price ?? '';

                return (
                  <MemberItemRow
                    key={member.id}
                    index={index}
                    totalMembers={items.length}
                    member={member}
                    rawPrice={priceVal}
                    rawName={rawItem?.name || ''}
                    isPaid={paidMemberIds.includes(member.id)}
                    forceExpanded={showAllDetails}
                    onTogglePaid={() => handleTogglePaid(member.id)}
                    onCopyReminder={() => handleCopyIndividualReminder(member)}
                    isBeingDragged={draggedIndex === index}
                    isDragTarget={dragOverIndex === index && draggedIndex !== index}
                    onNameChange={(val) => handleItemChange(member.id, 'name', val)}
                    onPriceChange={(val) => handleItemChange(member.id, 'price', val)}
                    onRemove={() => handleRemoveItem(member.id)}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                );
              })}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                className="w-full min-h-[40px] border-dashed border-hairline text-xs font-semibold text-ink-secondary hover:text-ink hover:border-ink hover:bg-subtle"
              >
                <Plus className="h-4 w-4 mr-1 text-ink-muted" />
                {t.split.addMember}
              </Button>
            </div>
          </section>

          {/* Section 4: Ledger Summary & Payment Tracking */}
          <BillLedgerSection
            result={calculationResult}
            paidMemberIds={paidMemberIds}
            onMarkAllPaid={handleMarkAllPaid}
            onResetPaid={handleResetPaid}
          />

          {/* Section 5: PromptPay QR */}
          <PromptPaySection
            promptPayAccount={promptPayAccount}
            onPromptPayAccountChange={setPromptPayAccount}
            parsedPromptPay={parsedPromptPay}
            onOpenQrModal={handleOpenQrModal}
          />
        </div>

        {/* In-page Primary Actions Block */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full">
          <Button
            type="button"
            variant="line"
            size="lg"
            onClick={handleCopyText}
            className="flex-1 min-h-[50px] font-bold text-sm shadow-xs"
          >
            {isCopied ? (
              <span className="inline-flex items-center gap-2 text-white font-bold">
                <Check className="h-4 w-4 text-white" />
                <span>{t.common.copied}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 font-bold">
                <Copy className="h-4 w-4" />
                <span>{t.common.copy}</span>
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleShareLink}
            className="flex-1 min-h-[50px] font-bold text-sm bg-surface border-hairline hover:bg-subtle shadow-xs"
          >
            {isLinkCopied ? (
              <span className="inline-flex items-center gap-2 text-emerald-600 font-bold">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{t.split.copiedShareLink}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 font-bold text-ink">
                <Share2 className="h-4 w-4 text-chili" />
                <span>{t.split.shareLink}</span>
              </span>
            )}
          </Button>
        </div>
      </main>

      {/* Sticky Bottom Summary & Action Dock */}
      <aside
        aria-label="Sticky bottom action dock"
        className="fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur-md border-t border-hairline py-2.5 px-3 sm:px-6 shadow-lg"
      >
        <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
          {/* Left: Live Grand Total */}
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted truncate">
              {t.split.grandTotalLive} ({calculationResult.members.length} {t.split.peopleCount})
            </div>
            <div className="flex items-baseline gap-1 font-mono font-bold text-lg sm:text-xl text-ink tabular-nums">
              <span>{calculationResult.grandTotal}</span>
              <span className="text-xs font-semibold text-ink-secondary">{t.common.baht}</span>
            </div>
          </div>

          {/* Right: Quick Share & Copy Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="line"
              size="md"
              onClick={handleCopyText}
              className="min-h-[44px] font-bold text-xs sm:text-sm px-3 sm:px-4 shadow-xs"
            >
              {isCopied ? (
                <span className="inline-flex items-center gap-1.5 text-white">
                  <Check className="h-4 w-4" />
                  <span>{t.common.copied}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Copy className="h-4 w-4" />
                  <span>{t.split.shareLineSummary}</span>
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleShareLink}
              className="min-h-[44px] px-3 font-bold text-xs sm:text-sm bg-surface border-hairline hover:bg-subtle text-ink shadow-xs"
              title={t.split.shareLink}
            >
              {isLinkCopied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Share2 className="h-4 w-4 text-chili" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <QuickPasteModal
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onImport={handleImportQuickPaste}
      />

      {parsedPromptPay && (
        <PromptPayQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          promptPayId={parsedPromptPay.sanitized}
          totalAmount={calculationResult.grandTotal}
          items={qrItemOptions}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
