'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="bg-[#FAF8F5] text-[#141413]">
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center px-6 py-12">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#D9480F]">
            SYSTEM ERROR
          </p>
          <h1 className="mt-2 text-xl font-semibold">เกิดข้อผิดพลาดในระบบหลัก</h1>
          <p className="mt-2 text-sm text-[#57534E]">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-[#141413] px-5 py-2.5 text-sm font-medium text-white"
          >
            โหลดหน้าใหม่
          </button>
        </main>
      </body>
    </html>
  );
}
