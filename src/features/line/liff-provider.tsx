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
  isCustomName: boolean;
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
  const [isCustomName, setIsCustomName] = useState(false);

  // Restore or initialize guest user from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tan_sang_guest_profile');
      if (saved) {
        const parsed = JSON.parse(saved) as { userId?: string; displayName?: string };
        if (parsed.userId && parsed.displayName) {
          setProfile((prev) => ({
            ...prev,
            userId: parsed.userId!,
            displayName: parsed.displayName!,
          }));
          setIsCustomName(true);
          return;
        }
      }
      // Generate a persistent unique guest ID for this browser
      const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
      setProfile((prev) => ({
        ...prev,
        userId: guestId,
      }));
    } catch {
      // ignore
    }
  }, []);

  // Handle LIFF redirect state (?liff.state=/order/...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const liffState = urlParams.get('liff.state');
      if (liffState && liffState.startsWith('/') && window.location.pathname !== liffState) {
        window.location.replace(liffState);
      }
    }
  }, []);

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

        const inClient = liff.isInClient();
        setIsInLineClient(inClient);

        if (liff.isLoggedIn()) {
          try {
            const userProfile = await liff.getProfile();
            if (mounted && userProfile) {
              setProfile({
                userId: userProfile.userId,
                displayName: userProfile.displayName || 'ฉัน (ผู้สั่งอาหาร)',
                pictureUrl: userProfile.pictureUrl,
              });
              setIsCustomName(true);
            }
          } catch (profileErr) {
            console.error('Failed to get LIFF profile:', profileErr);
          }
        }
        // NOTE: In LINE In-App Browser, DO NOT call liff.login() automatically
        // because it triggers an OAuth redirect loop that hangs/crashes in-app webviews.
        // Users can smoothly browse and order as default guest profile or enter their name.
        if (mounted) {
          setIsReady(true);
        }
      })
      .catch((err) => {
        console.error('LIFF initialization error:', err);
        if (mounted) {
          setIsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateProfileName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfile((prev) => {
      const updated = {
        ...prev,
        displayName: trimmed,
      };
      try {
        localStorage.setItem(
          'tan_sang_guest_profile',
          JSON.stringify({ userId: updated.userId, displayName: trimmed }),
        );
      } catch {
        // ignore
      }
      return updated;
    });
    setIsCustomName(true);
  };

  const setDevPersona = (userId: string) => {
    const found = DEV_PERSONAS.find((p) => p.userId === userId);
    if (found) {
      setProfile(found);
      setIsCustomName(true);
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
      `ชวนสั่งอาหารร้าน "${payload.storeDisplayName}"\nแตะที่ลิงก์เพื่อเลือกเมนูและท็อปปิ้งได้เลยครับ\n${payload.orderUrl}`,
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
        isCustomName,
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
