'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LiffUserProfile } from '@/features/line/line.schema';
import type { LineFlexReceiptSharePayload } from '@/features/line/line.schema';
import type { RecipientOrderBreakdown } from '@/features/order-session/order-session.schema';
import {
  buildBillSummaryFlexMessage,
  buildSessionCreatedFlexMessage,
} from '@/server/services/line-flex.service';

const DEFAULT_PROFILE: LiffUserProfile = {
  userId: 'U_MEMBER_ME',
  displayName: 'ฉัน (ผู้สั่งอาหาร)',
};

const DEV_PERSONAS: LiffUserProfile[] = [
  {
    userId: 'U_HOST_1',
    displayName: 'หัวห้อง (Host)',
  },
  {
    userId: 'U_MEMBER_2',
    displayName: 'เพื่อน 1',
  },
  {
    userId: 'U_MEMBER_3',
    displayName: 'เพื่อน 2',
  },
];

interface LiffContextValue {
  profile: LiffUserProfile;
  isInLineClient: boolean;
  isReady: boolean;
  personas: LiffUserProfile[];
  setDevPersona: (userId: string) => void;
  updateProfileName: (name: string) => void;
  shareBillToLine: (
    payload: LineFlexReceiptSharePayload,
    recipientBreakdowns: RecipientOrderBreakdown[],
  ) => Promise<{ shared: boolean; message: string }>;
  shareSessionInviteToLine: (
    payload: LineFlexReceiptSharePayload,
  ) => Promise<{ shared: boolean; message: string }>;
}

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LiffUserProfile>(DEFAULT_PROFILE);
  const [isInLineClient, setIsInLineClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId || liffId === '1234567890-AbcdEfgh') {
      setIsReady(true);
      return;
    }

    let mounted = true;
    import('@line/liff')
      .then(async ({ default: liff }) => {
        await liff.init({ liffId });
        if (!mounted) return;

        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile();
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
          });
          setIsInLineClient(liff.isInClient());
        } else if (liff.isInClient()) {
          liff.login();
        }
        setIsReady(true);
      })
      .catch(() => {
        if (mounted) {
          setIsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateProfileName = (name: string) => {
    if (!name.trim()) return;
    setProfile((prev) => ({
      ...prev,
      displayName: name.trim(),
    }));
  };

  const setDevPersona = (userId: string) => {
    const found = DEV_PERSONAS.find((p) => p.userId === userId);
    if (found) {
      setProfile(found);
    }
  };

  const shareBillToLine = async (
    payload: LineFlexReceiptSharePayload,
    recipientBreakdowns: RecipientOrderBreakdown[],
  ): Promise<{ shared: boolean; message: string }> => {
    const flexMsg = buildBillSummaryFlexMessage(payload, recipientBreakdowns);

    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (liffId && liffId !== '1234567890-AbcdEfgh') {
        const { default: liff } = await import('@line/liff');
        if (liff.isApiAvailable('shareTargetPicker')) {
          const res = await liff.shareTargetPicker([flexMsg as never]);
          if (res) {
            return {
              shared: true,
              message: 'ส่งการ์ดสรุปบิลเข้าแชท LINE เรียบร้อยแล้ว',
            };
          }
          return {
            shared: false,
            message: 'ยกเลิกการเลือกห้องแชท LINE',
          };
        }
      }
    } catch {
      // Fallback to clipboard copy when outside LINE LIFF
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(JSON.stringify(flexMsg, null, 2));
    }
    return {
      shared: true,
      message: 'จำลองการแชร์ LINE Flex Message (คัดลอก JSON Flex ลง Clipboard แล้ว)',
    };
  };

  const shareSessionInviteToLine = async (
    payload: LineFlexReceiptSharePayload,
  ): Promise<{ shared: boolean; message: string }> => {
    const flexMsg = buildSessionCreatedFlexMessage(payload);

    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (liffId && liffId !== '1234567890-AbcdEfgh') {
        const { default: liff } = await import('@line/liff');
        if (liff.isApiAvailable('shareTargetPicker')) {
          const res = await liff.shareTargetPicker([flexMsg as never]);
          if (res) {
            return {
              shared: true,
              message: 'ส่งการ์ดชวนสั่งอาหารเข้ากลุ่ม LINE เรียบร้อยแล้ว',
            };
          }
          return {
            shared: false,
            message: 'ยกเลิกการเลือกห้องแชท LINE',
          };
        }
      }
    } catch {
      // Fallback
    }

    const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(
      `🍽️ ชวนสั่งอาหารร้าน "${payload.storeDisplayName}"\nแตะที่ลิงก์เพื่อเลือกเมนูและท็อปปิ้งได้เลยครับ 👇\n${payload.orderUrl}`,
    )}`;
    if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank');
      return {
        shared: true,
        message: 'เปิดหน้าต่างแชร์เข้าห้องแชท LINE แล้ว',
      };
    }

    return {
      shared: false,
      message: 'ไม่สามารถแชร์ได้',
    };
  };

  return (
    <LiffContext.Provider
      value={{
        profile,
        isInLineClient,
        isReady,
        personas: DEV_PERSONAS,
        setDevPersona,
        updateProfileName,
        shareBillToLine,
        shareSessionInviteToLine,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  const ctx = useContext(LiffContext);
  if (!ctx) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return ctx;
}
