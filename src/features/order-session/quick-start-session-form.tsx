'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useLiff } from '@/features/line/liff-provider';
import type { Store } from '@/features/store-catalog/store-catalog.schema';
import { getLocalizedText } from '@/lib/utils/i18n.schema';
import { Button, Input, Select, Card } from '@/components/ui';

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

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const isCustom = selectedStoreId === 'CUSTOM';
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
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-5">
      <form onSubmit={handleStartSession} className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h2 className="text-base font-semibold text-ink">
            เปิดบิลสั่งอาหารห้องใหม่ (Host Quick Start)
          </h2>
          <span className="font-mono text-xs text-ink-secondary">
            Host: {profile.displayName}
          </span>
        </div>

        {errorMessage && (
          <p className="border border-red-500 bg-red-50 p-3 text-xs font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Select
              label="เลือกร้านอาหาร"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {getLocalizedText(s.name, 'th')} ({s.id})
                </option>
              ))}
              <option value="CUSTOM">+ ระบุชื่อร้านอาหารเอง...</option>
            </Select>
          </div>

          {selectedStoreId === 'CUSTOM' ? (
            <div>
              <Input
                label="ชื่อร้านอาหาร"
                required
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                placeholder="เช่น ข้าวมันไก่ตอนประตูน้ำ"
              />
            </div>
          ) : (
            <div>
              <Input
                label="รหัสร้านค้าอ้างอิง"
                disabled
                value={selectedStoreId}
                helperText="ระบบโหลดเมนูอัตโนมัติ"
              />
            </div>
          )}

          <div>
            <Input
              label="LINE Group ID"
              value={lineGroupId}
              onChange={(e) => setLineGroupId(e.target.value)}
              helperText="จำลองแชทกลุ่ม LINE"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isCreating}
            size="md"
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            {isCreating ? 'กำลังเปิดบิล...' : 'เปิดบิลสั่งอาหาร (เริ่มเลย)'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
