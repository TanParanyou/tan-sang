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
} from 'lucide-react';
import { AppNavbar } from '@/components/shared/app-navbar';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { PromptPayQrModal } from '@/components/shared/promptpay-qr-modal';
import { Button, Toast } from '@/components/ui';
import { useClipboardCopy } from '@/lib/hooks/use-clipboard-copy';
import { useDragReorder } from '@/lib/hooks/use-drag-reorder';
import { parsePromptPayTarget } from '@/lib/utils/promptpay';
import { BillInfoSection } from './components/bill-info-section';
import { BillLedgerSection } from './components/bill-ledger-section';
import { MemberItemRow } from './components/member-item-row';
import { PromptPaySection } from './components/promptpay-section';
import { QuickPasteModal } from './components/quick-paste-modal';
import type { SplitItem, SplitMethod } from './split-calculator.schema';
import {
  calculateSplitBill,
  formatSplitBillCopyText,
  reorderArray,
  sortSplitItems,
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

const INITIAL_BLANK_ITEMS: Array<{ id: string; name: string; price: number | '' }> = [
  { id: '1', name: '', price: '' },
  { id: '2', name: '', price: '' },
];

export function SplitCalculatorClient() {
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('PROPORTIONAL');
  const [promptPayAccount, setPromptPayAccount] = useState<string>('');
  const [items, setItems] = useState<Array<{ id: string; name: string; price: number | '' }>>(INITIAL_BLANK_ITEMS);

  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

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
    moveItem,
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
        const decoded = JSON.parse(decodeURIComponent(atob(encodedData)));
        if (decoded.items && Array.isArray(decoded.items)) {
          setItems(decoded.items);
          setDeliveryFeeInput(decoded.deliveryFee?.toString() ?? '0');
          setDiscountInput(decoded.discount?.toString() ?? '0');
          if (decoded.splitMethod) setSplitMethod(decoded.splitMethod);
          if (decoded.promptPay) setPromptPayAccount(decoded.promptPay);
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
      name: it.name.trim() || `คนที่ ${idx + 1}`,
      price: typeof it.price === 'number' ? it.price : 0,
    }));

    return calculateSplitBill({
      deliveryFee,
      discount,
      items: sanitizedItems,
      splitMethod,
      roundToInteger: true,
    });
  }, [deliveryFeeInput, discountInput, items, splitMethod]);

  const parsedPromptPay = useMemo(() => {
    return parsePromptPayTarget(promptPayAccount);
  }, [promptPayAccount]);

  const handleAddItem = () => {
    const newId = Date.now().toString();
    setItems((prev) => [
      ...prev,
      { id: newId, name: `คนที่ ${prev.length + 1}`, price: '' },
    ]);
    setTimeout(() => {
      document.getElementById(`price-input-${newId}`)?.focus();
    }, 50);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      notify('ต้องมีคนสั่งอย่างน้อย 1 คน');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
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

  const handleSort = (type: 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC') => {
    setItems((prev) => sortSplitItems(prev, type));
    if (type === 'PRICE_DESC') notify('จัดอันดับตามยอดเงิน (มาก ➔ น้อย) แล้ว');
    if (type === 'PRICE_ASC') notify('จัดอันดับตามยอดเงิน (น้อย ➔ มาก) แล้ว');
    if (type === 'NAME_ASC') notify('จัดอันดับตามชื่อ (ก-ฮ) แล้ว');
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
    notify('ล้างข้อมูลเรียบร้อยแล้ว');
  };

  const handleLoadDemo = () => {
    setDeliveryFeeInput('12');
    setDiscountInput('83');
    setSplitMethod('PROPORTIONAL');
    setItems(SAMPLE_DEMO_ITEMS);
    setPromptPayAccount('0812345678');
    notify('โหลดข้อมูลตัวอย่างจากชีตแล้ว');
  };

  const handleImportQuickPaste = (parsed: Array<{ name: string; price: number }>) => {
    const newItems = parsed.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: p.name,
      price: p.price,
    }));
    setItems(newItems);
    notify(`นำเข้ารายชื่อสำเร็จ ${newItems.length} คน!`);
  };

  const handleCopyText = async () => {
    const text = formatSplitBillCopyText(calculationResult, {
      promptPayAccount: promptPayAccount.trim() || undefined,
    });
    await copyToClipboard(text, 'คัดลอกสรุปยอดส่ง LINE / ขุนทอง แล้ว!');
  };

  const handleShareLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        deliveryFee: parseFloat(deliveryFeeInput) || 0,
        discount: parseFloat(discountInput) || 0,
        splitMethod,
        promptPay: promptPayAccount.trim(),
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: typeof it.price === 'number' ? it.price : 0,
        })),
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
      const shareUrl = `${window.location.origin}/harn?d=${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      setIsLinkCopied(true);
      notify('คัดลอกลิงก์แชร์บิลนี้แล้ว! ส่งต่อให้เพื่อนเปิดดูได้เลย');
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch {
      notify('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  const handleOpenQrModal = () => {
    if (!parsedPromptPay) {
      notify('กรุณาระบุเบอร์พร้อมเพย์ (10 หลัก) หรือเลขบัตร ปชช. (13 หลัก)');
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

  return (
    <div className="min-h-screen bg-canvas pb-28">
      <DevPersonaBar />
      <AppNavbar
        title="ตาลหาร (Tan-Harn)"
        subtitle="เครื่องคิดเลขหารค่าข้าว & ปันส่วนลด"
        backHref="/"
        backLabel="หน้าหลัก"
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-theme px-2.5 text-xs font-medium text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">รีเซ็ต</span>
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-theme px-2.5 text-xs font-semibold text-chili bg-chili/10 hover:bg-chili/15 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>ตัวอย่าง</span>
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-lg px-3 sm:px-4 pt-4 space-y-4">
        {/* Unified Calculation Paper Sheet */}
        <div className="rounded-xl border border-hairline bg-surface shadow-xs divide-y divide-hairline overflow-hidden">
          {/* Section 1: ข้อมูลบิลส่วนกลาง (ค่าส่ง, ส่วนลด) */}
          <BillInfoSection
            deliveryFeeInput={deliveryFeeInput}
            onDeliveryFeeChange={setDeliveryFeeInput}
            discountInput={discountInput}
            onDiscountChange={setDiscountInput}
            splitMethod={splitMethod}
            onSplitMethodChange={setSplitMethod}
            netDiscount={calculationResult.netDiscount}
          />

          {/* Section 2: รายชื่อคนสั่ง (Member List) */}
          <section aria-labelledby="members-heading" className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="members-heading" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  2. รายชื่อคนสั่งอาหาร
                </h2>
                <p className="text-sm font-semibold text-ink">
                  {items.length} คน
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5">
                <div className="relative inline-flex items-center">
                  <select
                    aria-label="จัดอันดับรายชื่อ"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSort(e.target.value as 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC');
                        e.target.value = '';
                      }
                    }}
                    className="appearance-none h-[34px] pl-2.5 pr-7 text-xs font-semibold text-ink bg-subtle hover:bg-neutral-200/70 border border-hairline rounded-theme focus:outline-none cursor-pointer leading-[32px] box-border"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      จัดเรียง
                    </option>
                    <option value="PRICE_DESC">ยอดมาก ➔ น้อย</option>
                    <option value="PRICE_ASC">ยอดน้อย ➔ มาก</option>
                    <option value="NAME_ASC">ตามชื่อ (ก-ฮ)</option>
                  </select>
                  <ArrowUpDown className="absolute right-2 h-3.5 w-3.5 text-ink-muted pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuickPasteOpen(true)}
                  className="inline-flex h-[34px] items-center gap-1 rounded-theme px-2.5 text-xs font-semibold text-chili border border-chili/30 bg-chili/5 hover:bg-chili/10 transition-colors shrink-0 box-border"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>วางด่วน</span>
                </button>
              </div>
            </div>

            {/* Table Header: Legible ledger columns */}
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-muted px-2 pt-1 border-b border-hairline pb-1.5">
              <span className="w-8 text-center">#</span>
              <span className="flex-1 pl-2">ชื่อผู้สั่ง</span>
              <span className="w-28 text-right pr-8">ยอดเดิม</span>
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
                เพิ่มคนสั่งอาหาร
              </Button>
            </div>
          </section>

          {/* Section 3: สรุปยอดเงินทั้งบิล (Receipt Ledger) */}
          <BillLedgerSection result={calculationResult} />

          {/* Section 4: พร้อมเพย์ และปุ่มสร้าง QR Code */}
          <PromptPaySection
            promptPayAccount={promptPayAccount}
            onPromptPayAccountChange={setPromptPayAccount}
            parsedPromptPay={parsedPromptPay}
            onOpenQrModal={handleOpenQrModal}
          />
        </div>

        {/* Clean Primary Actions Block (Right under the ticket - No dual-dock crowding) */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleCopyText}
            className="flex-1 min-h-[50px] !bg-[#059669] hover:!bg-[#047857] active:!bg-[#065f46] !border-[#059669] !text-white font-bold text-sm shadow-sm"
          >
            {isCopied ? (
              <span className="inline-flex items-center gap-2 text-white font-bold">
                <Check className="h-4 w-4 text-white" />
                <span>คัดลอกเรียบร้อยแล้ว!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-white font-bold">
                <Copy className="h-4 w-4 text-white" />
                <span>คัดลอกสรุปยอดส่ง LINE / ขุนทอง</span>
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleShareLink}
            className="min-h-[50px] px-5 text-sm font-semibold text-ink hover:bg-subtle"
          >
            {isLinkCopied ? (
              <span className="inline-flex items-center gap-1.5 text-line-accent">
                <Check className="h-4 w-4 text-line-accent" />
                <span>คัดลอกลิงก์แล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Share2 className="h-4 w-4 text-ink-muted" />
                <span>แชร์ลิงก์บิลนี้</span>
              </span>
            )}
          </Button>
        </div>
      </main>

      {/* Quick Paste Modal */}
      <QuickPasteModal
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onImport={handleImportQuickPaste}
      />

      {/* PromptPay QR Code Modal */}
      <PromptPayQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        promptPayId={promptPayAccount}
        totalAmount={calculationResult.grandTotal}
        items={qrItemOptions}
      />

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
