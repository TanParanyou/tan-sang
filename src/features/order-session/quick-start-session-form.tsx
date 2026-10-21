'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Sparkles, Store as StoreIcon } from 'lucide-react';
import { useLiff } from '@/features/line/liff-provider';
import type { Store } from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { Button, Input, Select, Card, Badge } from '@/components/ui';

export function QuickStartSessionForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const { profile } = useLiff();
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id ?? 'CUSTOM');
  const [customStoreName, setCustomStoreName] = useState<string>('');
  const [lineGroupId, setLineGroupId] = useState<string>(
    `C_GROUP_${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isCustom = selectedStoreId === 'CUSTOM';
  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineGroupId: lineGroupId.trim() || 'C_DEFAULT_GROUP',
          hostUserId: profile.userId,
          storeId: isCustom ? null : selectedStoreId,
          customStoreName: isCustom ? customStoreName.trim() : null,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: { id: string };
        error?: { message: string };
      };

      if (!json.ok || !json.data) {
        setErrorMessage(json.error?.message ?? 'ไม่สามารถเปิดบิลได้');
        return;
      }

      router.push(`/order/${json.data.id}`);
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 shadow-sm border-hairline bg-surface">
      <form onSubmit={handleStartSession} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-chili/10 text-chili">
              <StoreIcon className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-ink">
              เปิดบิลสั่งอาหารห้องใหม่ <span className="text-xs font-normal text-ink-muted">(Host Quick Start)</span>
            </h2>
          </div>
          <span className="font-mono text-xs rounded-full bg-subtle px-2.5 py-1 text-ink-secondary border border-hairline">
            Host: <strong className="text-ink">{profile.displayName}</strong>
          </span>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Store Selection */}
          <div className="space-y-1.5">
            <Select
              label="เลือกร้านอาหาร"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {getLocalizedText(s.name, 'th')}
                </option>
              ))}
              <option value="CUSTOM">+ ระบุชื่อร้านอาหารเอง...</option>
            </Select>

            {/* Subtle store info tag */}
            {!isCustom && selectedStore && (
              <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary pt-0.5">
                <span className="font-mono rounded-theme border border-hairline bg-subtle px-1.5 py-0.5 font-semibold text-ink">
                  {selectedStore.id}
                </span>
                <span>• ระบบโหลดเมนูและราคาอัตโนมัติ</span>
              </div>
            )}
          </div>

          {/* LINE Group ID */}
          <div className="space-y-1.5">
            <Input
              label="LINE Group ID"
              value={lineGroupId}
              onChange={(e) => setLineGroupId(e.target.value)}
              helperText="จำลองแชทกลุ่ม LINE สำหรับจัดกลุ่มออเดอร์"
              required
            />
          </div>
        </div>

        {isCustom && (
          <div className="rounded-theme border border-dashed border-hairline bg-subtle/50 p-3.5">
            <Input
              label="ชื่อร้านอาหารที่ต้องการสั่ง"
              required
              value={customStoreName}
              onChange={(e) => setCustomStoreName(e.target.value)}
              placeholder="เช่น ข้าวมันไก่ตอนประตูน้ำ, ก๋วยเตี๋ยวเรืออยุธยา"
              helperText="สมาชิกในห้องจะสามารถพิมพ์ชื่อเมนูอาหารและราคาได้อย่างอิสระ"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-hairline">
          <p className="text-xs text-ink-muted">
            กดเปิดบิลเพื่อสร้างห้องและเริ่มให้เพื่อนๆ ในกลุ่มสั่งอาหารได้ทันที
          </p>
          <Button
            type="submit"
            disabled={isCreating}
            loading={isCreating}
            size="md"
            className="w-full sm:w-auto px-6 font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            {isCreating ? 'กำลังเปิดบิล...' : 'เปิดบิลสั่งอาหาร (เริ่มเลย)'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
