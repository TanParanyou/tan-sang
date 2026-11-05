# DESIGN.md — Tan-Sang Visual System (Impeccable Spec)

> Grounded in [Impeccable](https://impeccable.style/docs/) design principles: intentional typography, calibrated spacing, high-contrast utilitarian warmth, and zero "AI slop" anti-patterns.

## 1. Aesthetic Direction: "Warm Street-Food Editorial & Crisp Thermal Receipt"
Tan-Sang blends the appetizing warmth of Thai lunch culture with the crisp, trustworthy legibility of a paper kitchen ticket.
- **No Cards-in-Cards Soup:** Instead of wrapping every menu item in a shadowed box inside another shadowed container, use **full-bleed or clean surface groups separated by hairline `1px` dividers (`#E7E3DA`)**.
- **No Purple-to-Blue Gradients or Decorative Icon Tiles:** Surfaces are solid, warm-tinted paper tones. Icons appear only where they aid action recognition (search, copy, print, lock, delete).
- **Tabular Precision:** Every price, quantity badge, and subtotal uses `font-mono tabular-nums` so columns align vertically like an accountant's ledger.

---

## 2. Color Tokens (OKLCH & Hex Equivalents)

### Light Mode (Warm Palm & Roasted Cocoa)
| Token Role | CSS Variable / Tailwind | OKLCH | Hex Fallback | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas (Background)** | `--bg-canvas` / `bg-canvas` | `oklch(0.97 0.008 75)` | `#FAF6F0` | Warm unbleached paper background matching mascot body |
| **Surface (Elevated)** | `--bg-surface` / `bg-surface` | `oklch(1.00 0 0)` | `#FFFFFF` | Active sheets, receipt paper, primary list group |
| **Surface Subtle** | `--bg-subtle` / `bg-subtle` | `oklch(0.94 0.012 75)` | `#F3ECE2` | Segmented control track, muted pill background |
| **Ink Primary** | `--text-primary` / `text-ink` | `oklch(0.25 0.025 45)` | `#362520` | Headings, menu titles, prices (Roasted Cocoa Ink, WCAG AAA) |
| **Ink Secondary** | `--text-secondary` / `text-ink-secondary` | `oklch(0.46 0.025 45)` | `#6E5850` | Variants, add-on descriptions, recipient labels |
| **Ink Muted** | `--text-muted` / `text-ink-muted` | `oklch(0.58 0.020 45)` | `#948078` | Timestamps, secondary metadata |
| **Border Hairline** | `--border-subtle` / `border-hairline` | `oklch(0.90 0.012 75)` | `#E9DFD3` | List row dividers, section borders |
| **Brand Primary (Warm Palm Caramel)** | `--color-accent` / `bg-chili` | `oklch(0.58 0.17 48)` | `#D4621A` | Primary CTA ("เพิ่มลงบิล", "คัดลอกส่งร้าน") |
| **LINE / Ready Green** | `--color-success` / `bg-line` | `oklch(0.60 0.15 160)` | `#059669` | "เลือกเสร็จแล้ว (Ready)", "แชร์เข้า LINE" |
| **Warning / Lock Amber** | `--color-warning` / `bg-amber-600` | `oklch(0.55 0.14 65)` | `#B45309` | Closed session badge, Host lock confirmation |
| **Danger / Ban Red** | `--color-error` / `text-red-600` | `oklch(0.58 0.22 27)` | `#DC2626` | Delete item, Banned menu indicator |

### Dark Mode (Warm Cocoa & Espresso Night)
| Token Role | CSS Variable / Tailwind | Hex Token | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas (Background)** | `--bg-canvas` / `bg-canvas` | `#181311` | Deep dark roasted espresso coffee background |
| **Surface (Elevated)** | `--bg-surface` / `bg-surface` | `#231B18` | Dark cocoa surface for cards and trays |
| **Surface Subtle** | `--bg-subtle` / `bg-subtle` | `#2E231F` | Warm dark mocha track and muted buttons |
| **Ink Primary** | `--text-primary` / `text-ink` | `#F6ECE2` | Warm steamed milk froth text (WCAG AAA) |
| **Ink Secondary** | `--text-secondary` / `text-ink-secondary` | `#C6B5A8` | Warm light mocha text |
| **Ink Muted** | `--text-muted` / `text-ink-muted` | `#988578` | Muted cocoa timestamps and secondary meta |
| **Border Hairline** | `--border-subtle` / `border-hairline` | `#3E312B` | Warm dark hairline dividers |
| **Brand Primary (Glowing Caramel)** | `--color-accent` / `bg-chili` | `#E5732F` | Luminous toasted caramel CTA button |
| **LINE / Ready Green** | `--color-success` / `bg-line` | `#10B981` | Vibrant emerald green for dark surfaces |

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
