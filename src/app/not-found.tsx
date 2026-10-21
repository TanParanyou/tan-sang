import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-start justify-center px-6 py-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-chili">404</p>
      <h1 className="mt-1 text-xl font-semibold text-ink">ไม่พบห้องสั่งอาหารหรือหน้าที่ระบุ</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        ลิงก์บิลสั่งอาหารอาจไม่ถูกต้อง หรือถูกยกเลิกไปแล้ว
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
