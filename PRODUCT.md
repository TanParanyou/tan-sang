# PRODUCT.md — Tan-Sang (ตาลสั่ง)

> Durable Product Truth following the [Impeccable](https://impeccable.style/docs/) specification. Keeps product intent, audience, operating context, and domain terminology separate from visual styling.

## 1. Product Purpose & Core Problem
**Tan-Sang (ตาลสั่ง)** is a group food ordering web application built for **LINE Group Chats** via **LINE Front-end Framework (LIFF)** and **LINE Messaging API**.

When colleagues or friends order lunch together in a LINE group, someone (the **Host**) inevitably suffers from scrolling through dozens of chat messages to tally identical dishes, special notes ("เผ็ดน้อย", "ไม่ใส่ผัก"), add-ons ("+ไข่ดาว"), and individual split bills.

Tan-Sang solves this in three frictionless steps:
1. **Host opens a session** for a specific store (or custom restaurant name) inside a LINE group.
2. **Members tap the LIFF link**, pick menus/variants/options (or type a custom dish), optionally specify who they are ordering for (`recipient_name`), and mark themselves **Ready ("เลือกเสร็จแล้ว")**.
3. **Host locks ("Close Order") the session** with one tap, unlocking:
   - **Merchant Grouped View & 1-Tap Copy:** Combines identical dishes + variants + options + notes (`ข้าวผัดหมู (ธรรมดา) + ไข่ดาว x 3`) ready to paste directly into the restaurant's LINE/Facebook chat.
   - **Individual Breakdown View:** Shows exact totals per recipient for effortless bill splitting.
   - **Printable Receipt & LINE Flex Share:** Supports 80mm thermal printers, standard A4 paper, and `liff.shareTargetPicker()` back to the group chat.

---

## 2. Target Audience & Operating Context
- **Primary Users:** Thai office workers, teams, and friend groups ordering meals inside LINE on mobile devices (iOS/Android Webview).
- **Environment Constraints:**
  - **85%+ Mobile Webview (LINE LIFF):** Viewport width is typically `360px–430px` with a persistent top LINE navigation bar. Vertical screen real estate is precious.
  - **Time-Critical Usage:** Users open the app during a 2-minute lunch rush. Every extra tap or confusing two-step cart confirmation causes drop-off.
  - **Single-Step Shared Tray:** Selecting an item adds it directly to the group session tray (editable while `status === 'OPEN'`). The **"Ready"** toggle signals to the Host that a member is done choosing.

---

## 3. Primary Intent per Surface (Impeccable Intent Model)
- **`/order/[sessionId]` (Open State) → OPERATE:** High-efficiency menu browsing, single-thumb variant/add-on drawer, immediate shared tray visibility, and clear Ready/Host Lock controls.
- **`/order/[sessionId]` (Closed State) & `/receipt/[sessionId]` → READ & OPERATE:** Scannable tabular financial breakdown, zero-clutter print output (`80mm` & `A4`), and instant clipboard export.
- **`/admin/stores` → OPERATE:** Fast catalog maintenance (stores, menus, variants, add-ons, and out-of-stock/banned toggles).

---

## 4. Domain Terminology
| Term | Thai UI Term | Meaning |
| :--- | :--- | :--- |
| **Order Session** | บิลกลุ่ม / ห้องสั่งอาหาร | A single group ordering round bound to `line_group_id` (`OPEN` or `CLOSED`). |
| **Host** | หัวหน้าห้อง (คนเปิดบิล) | The user (`host_user_id`) who initiated the session and has authority to lock (`CLOSE`) it. |
| **Recipient** | ชื่อคนรับอาหาร (`recipient_name`) | Defaults to the LINE user's display name, editable when ordering on behalf of a colleague. |
| **Variant** | ขนาด / ราคา (`ธรรมดา`, `พิเศษ`) | Base price tier of a menu item (`menu_price_variants`). |
| **Option / Add-on** | ท็อปปิ้ง / เพิ่มเติม (`ไข่ดาว`) | Extra items (`menu_options`) attached to an order item (`order_item_options`). |
| **Ready Status** | เลือกเสร็จแล้ว | Signals that a participant has finished adding their items. |
| **Grouped View** | สรุปส่งร้าน (รวมรายการซ้ำ) | Aggregated list combining identical menu + variant + options + note. |
| **Individual Breakdown** | แยกยอดตามรายชื่อ | Itemized list and subtotal grouped by `recipient_name`. |
