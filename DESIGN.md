# DESIGN.md — Tan-Sang Visual System (Impeccable Spec)

> Grounded in [Impeccable](https://impeccable.style/docs/) design principles: intentional typography, calibrated spacing, high-contrast utilitarian warmth, and zero "AI slop" anti-patterns.

## 1. Aesthetic Direction: "Warm Street-Food Editorial & Crisp Thermal Receipt"
Tan-Sang blends the appetizing warmth of Thai lunch culture with the crisp, trustworthy legibility of a paper kitchen ticket.
- **No Cards-in-Cards Soup:** Instead of wrapping every menu item in a shadowed box inside another shadowed container, use **full-bleed or clean surface groups separated by hairline `1px` dividers (`#E7E3DA`)**.
- **No Purple-to-Blue Gradients or Decorative Icon Tiles:** Surfaces are solid, warm-tinted paper tones. Icons appear only where they aid action recognition (search, copy, print, lock, delete).
- **Tabular Precision:** Every price, quantity badge, and subtotal uses `font-mono tabular-nums` so columns align vertically like an accountant's ledger.

---

## 2. Color Tokens (OKLCH & Hex Equivalents)

| Token Role | CSS Variable / Tailwind | OKLCH | Hex Fallback | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas (Background)** | `--bg-canvas` / `bg-[#FAF8F5]` | `oklch(0.98 0.006 85)` | `#FAF8F5` | Warm unbleached paper background |
| **Surface (Elevated)** | `--bg-surface` / `bg-white` | `oklch(1.00 0 0)` | `#FFFFFF` | Active sheets, receipt paper, primary list group |
| **Surface Subtle** | `--bg-subtle` / `bg-[#F3EFEA]` | `oklch(0.95 0.01 80)` | `#F3EFEA` | Segmented control track, muted pill background |
| **Ink Primary** | `--text-primary` / `text-[#141413]` | `oklch(0.19 0.005 85)` | `#141413` | Headings, menu titles, prices (WCAG AAA) |
| **Ink Secondary** | `--text-secondary` / `text-[#57534E]` | `oklch(0.45 0.012 75)` | `#57534E` | Variants, add-on descriptions, recipient labels |
| **Ink Muted** | `--text-muted` / `text-[#78716C]` | `oklch(0.56 0.012 75)` | `#78716C` | Timestamps, secondary metadata |
| **Border Hairline** | `--border-subtle` / `border-[#E7E3DA]` | `oklch(0.91 0.012 82)` | `#E7E3DA` | List row dividers, section borders |
| **Brand Primary (Chili Orange)** | `--accent-primary` / `bg-[#D9480F]` | `oklch(0.58 0.19 36)` | `#D9480F` | Primary CTA ("เพิ่มลงบิล", "คัดลอกส่งร้าน") |
| **LINE / Ready Green** | `--accent-line` / `bg-[#059669]` | `oklch(0.60 0.15 160)` | `#059669` | "เลือกเสร็จแล้ว (Ready)", "แชร์เข้า LINE" |
| **Warning / Lock Amber** | `--accent-warn` / `bg-[#B45309]` | `oklch(0.55 0.14 65)` | `#B45309` | Closed session badge, Host lock confirmation |
| **Danger / Ban Red** | `--accent-danger` / `text-[#DC2626]` | `oklch(0.58 0.22 27)` | `#DC2626` | Delete item, Banned menu indicator |

---

## 3. Typography Scale & Pairing
- **Primary UI & Thai Body (`--font-sans`):** `'IBM Plex Sans Thai'`, `'Noto Sans Thai'`, system sans-serif.
  - Chosen for generous Thai vowel/tone-mark clearance and crisp geometric legibility at small mobile sizes.
- **Numeric & Receipt Ledger (`--font-mono`):** `'JetBrains Mono'`, `'IBM Plex Mono'`, monospace.
  - Mandatory `tabular-nums` on all prices (`50 ฿`, `+10 ฿`), item counts (`x 3`), and session codes.

### Type Scale (Mobile-First)
- **Store Header / Page Title:** `1.25rem` (`20px`), `font-semibold`, `tracking-tight`, `leading-snug`
- **Section Heading:** `0.875rem` (`14px`), `font-semibold`, uppercase tracking for English labels or bold compact Thai headers
- **Menu Item Title:** `0.9375rem` (`15px`), `font-medium`, `text-[#141413]`
- **Option / Note / Recipient Meta:** `0.8125rem` (`13px`), `text-[#57534E]`
- **Price & Quantity Badge:** `0.9375rem` (`15px`), `font-mono font-semibold tabular-nums`

---

## 4. Layout, Spacing & Anti-Pattern Guardrails
1. **Max Width & Mobile Ergonomics:**
   - LIFF views (`/order/[sessionId]`, `/receipt/[sessionId]`) center within `max-w-lg` (`512px`) on desktop while filling `100%` edge-to-edge on mobile.
   - Interactive tap targets must be at least **`44px` tall** (`min-h-[44px]`) for effortless thumb operation.
2. **Flat Divider Lists over Nested Cards:**
   - Menu catalogs and order trays use a single clean container (`bg-white border-y sm:border sm:rounded-xl border-[#E7E3DA] divide-y divide-[#E7E3DA]`). Never place bordered cards inside another bordered card.
3. **Sticky Bottom Dock:**
   - Reserved exclusively for high-frequency session actions: Participant's personal total + **"เลือกเสร็จแล้ว (Ready)"** toggle, and the Host's **"ปิดรับออเดอร์ (Close Order)"** action.
4. **Print Fidelity (`/receipt/[sessionId]`):**
   - `@media print` strips all navigation chrome, shadows, and interactive buttons (`print:hidden`).
   - Supports toggling between **80mm Thermal Roll (`max-w-[78mm]`)** with dashed receipt rules (`border-dashed border-black`) and **A4 Summary Sheet (`max-w-[210mm]`)**.
