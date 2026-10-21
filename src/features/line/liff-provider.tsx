'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LiffUserProfile } from '@/features/line/line.schema';
import type { LineFlexReceiptSharePayload } from '@/features/line/line.schema';
import type { RecipientOrderBreakdown } from '@/features/order-session/order-session.schema';
import { buildBillSummaryFlexMessage } from '@/server/services/line-flex.service';

const DEV_PERSONAS: LiffUserProfile[] = [
  {
    userId: 'U_HOST_TAN',
    displayName: 'ตาน (Host)',
  },
  {
    userId: 'U_MEMBER_PRAEW',
    displayName: 'แพรว (Design)',
  },
  {
    userId: 'U_MEMBER_BANK',
    displayName: 'แบงค์ (Backend)',
  },
];

interface LiffContextValue {
  profile: LiffUserProfile;
  isInLineClient: boolean;
  isReady: boolean;
  personas: LiffUserProfile[];
  setDevPersona: (userId: string) => void;
  shareBillToLine: (
    payload: LineFlexReceiptSharePayload,
    recipientBreakdowns: RecipientOrderBreakdown[],
  ) => Promise<{ shared: boolean; message: string }>;
}

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LiffUserProfile>(DEV_PERSONAS[0]!);
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

  return (
    <LiffContext.Provider
      value={{
        profile,
        isInLineClient,
        isReady,
        personas: DEV_PERSONAS,
        setDevPersona,
        shareBillToLine,
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
