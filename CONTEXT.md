# CONTEXT.md — Tan-Sang Ubiquitous Language & Business Dictionary

> **พจนานุกรมคำศัพท์ธุรกิจและแหล่งความจริงเดียว (Single Source of Truth) ประจำระบบ Tan-Sang (ตาลสั่ง)**
> ทุกส่วนในโค้ด (Entities, DTOs, UI Labels, Error Messages, AI Prompts) ต้องใช้คำศัพท์ที่ตรงกันตามตารางนี้อย่างเคร่งครัด

---

## 🍽️ 1. Domain Terminology (พจนานุกรมศัพท์ธุรกิจ)

| ภาษาอังกฤษ (Domain Term) | คำแสดงผลภาษาไทย (UI Label) | นิยามและความหมายในระบบ | Entity / Field อ้างอิง |
| :--- | :--- | :--- | :--- |
| **Order Session** | บิลกลุ่ม / รอบการสั่งอาหาร | รอบการสั่งอาหาร 1 ครั้งที่ผูกกับ LINE Group (`OPEN` หรือ `CLOSED`) | `order_sessions` (`status`) |
| **Host** | หัวหน้าห้อง / คนเปิดบิล | สมาชิก LINE ผู้เปิดรอบการสั่งอาหาร และมีสิทธิ์ล็อคบิล (`CLOSE`) หรือยกเลิกรอบ | `order_sessions.host_user_id` |
| **Participant / Member** | ผู้ร่วมสั่งอาหาร | สมาชิกใน LINE Group ที่เข้ามาเลือกเมนูใน Order Session | `ready_user_ids`, `ordered_by_user_id` |
| **Recipient** | ชื่อคนรับอาหาร | ชื่อที่ระบุว่าอาหารจานนี้เป็นของใคร (เริ่มต้นดึงชื่อ LINE Display Name แต่เปลี่ยนเป็นชื่อเพื่อนได้) | `order_items.recipient_name` |
| **Store** | ร้านอาหาร | ร้านค้าที่ลงทะเบียนในระบบแคตตาล็อกกลาง | `stores` (`id`, `name`) |
| **Custom Store** | ร้านตามสั่งกำหนดเอง | ชื่อร้านที่ Host พิมพ์เองเมื่อไม่ได้เลือกร้านจากแคตตาล็อก | `order_sessions.custom_store_name` |
| **Store Menu** | เมนูอาหารของร้าน | รายการอาหารหลักของร้านค้า มีสถานะ `ACTIVE`, `OUT_OF_STOCK`, `BANNED` | `store_menus` |
| **Menu Variant** | ขนาด / รูปแบบราคา | รูปแบบราคาหลักของอาหาร เช่น `ธรรมดา` (50฿), `พิเศษ` (60฿) | `menu_price_variants` |
| **Menu Option / Add-on** | ท็อปปิ้ง / รายการเพิ่มเติม | รายการเสริมที่เลือกเพิ่มได้ เช่น `ไข่ดาว` (+10฿), `ไข่เจียว` (+15฿) | `menu_options`, `order_item_options` |
| **Ready Status** | เลือกเสร็จแล้ว | สถานะที่ผู้ร่วมสั่งกดยืนยันว่าเลือกอาหารครบแล้ว เพื่อให้ Host ทราบจำนวนคนที่พร้อม | `order_sessions.ready_user_ids` |
| **Session Status** | สถานะรอบบิล | สถานะปัจจุบันของบิล: `OPEN` (กำลังสั่ง) หรือ `CLOSED` (ปิดรับออเดอร์แล้ว) | `order_sessions.status` |
| **Grouped View** | สรุปส่งร้าน (รวมรายการซ้ำ) | มุมมองสรุปออเดอร์ที่จัดกลุ่มเมนู + ขนาด + ท็อปปิ้ง + หมายเหตุที่เหมือนกันเข้าด้วยกัน สำหรับส่งไลน์ร้าน | ฟังก์ชันคำนวณ `groupIdenticalItems` |
| **Individual Breakdown** | แยกยอดตามรายชื่อ | มุมมองสรุปยอดเงินและรายการอาหารแยกตามรายชื่อผู้รับ (`recipient_name`) สำหรับหารเงิน | ฟังก์ชันคำนวณ `calculateRecipientTotals` |
| **Thermal Receipt** | สลิปใบเสร็จ (80mm) | รูปแบบการแสดงผลและพิมพ์สลิปตามขนาดกระดาษพิมพ์ใบเสร็จความร้อน 80mm | `/receipt/[sessionId]` (`@media print`) |
| **Document Sequence** | เลขที่เอกสาร / เลขที่บิล | ลำดับเลขที่เอกสารแบบ Concurrency-Safe Zero Collision เช่น `TS-2611-0001` | `document_sequences` |
| **PromptPay QR** | QR โค้ดพร้อมเพย์ | QR รับเงินมาตรฐาน EMVCo ที่คำนวณยอดเงินรวมของบิลหรือรายบุคคลอัตโนมัติ | `src/lib/utils/promptpay.ts` |

---

## 📐 2. Business Rules & Invariants (กฎทางธุรกิจที่ห้ามละเมิด)

1. **One Active Session Per Group (1 บิลเปิดต่อ 1 กลุ่ม):** 
   - ใน 1 `line_group_id` สามารถมีรอบการสั่งที่สถานะ `OPEN` ได้เพียง **1 บิลเท่านั้น**
   - หากมีการพยายามเปิดบิลใหม่ขณะที่ยังมีบิลค้างอยู่ ระบบต้องปฏิเสธด้วยรหัสข้อผิดพลาด `ACTIVE_SESSION_ALREADY_EXISTS`
2. **Host Authority (อำนาจของหัวหน้าห้อง):**
   - ผู้ที่มีสิทธิ์กด **"ปิดรับออเดอร์" (Close Order)** หรือ **"ลบบิล" (Delete Session)** ได้ คือ `host_user_id` เท่านั้น
   - การกระทำโดยผู้ใช้คนอื่นต้องถูกปฏิเสธด้วย `UNAUTHORIZED_HOST_ACTION`
3. **Session Immutability upon Close (ห้ามแก้ไขเมื่อปิดบิลแล้ว):**
   - เมื่อสถานะของบิลเปลี่ยนเป็น `CLOSED` แล้ว จะไม่อนุญาตให้เพิ่ม ลบ หรือแก้ไขรายการอาหาร (`order_items`) อีกต่อไป
   - หากมีการเรียก Mutation API จะถูกตอบกลับด้วย `ORDER_SESSION_CLOSED`
4. **Item Ownership Guard (การแก้ไขรายการอาหาร):**
   - สมาชิกทั่วไปสามารถแก้ไขหรือลบเฉพาะรายการอาหารที่ตนเองสั่ง (`ordered_by_user_id`)
   - ยกเว้นกรณีที่ Host เป็นผู้ลบเพื่อจัดการความเรียบร้อย
5. **Vote Ban Auto-Threshold:**
   - เมนูที่ถูกสมาชิกรายงานหรือโหวตแบนสะสมครบ 3 ครั้ง (`vote_ban_count >= 3`) จะถูกปรับสถานะเป็น `BANNED` โดยอัตโนมัติ

---

## 🎨 3. UI Intent & Tone (โทนเสียงและการสื่อสารในหน้าจอ)

- **โทนเสียง:** อบอุ่น เป็นมิตร สไตล์เพื่อนร่วมงานชวนกินข้าว แต่กระชับ ชัดเจน และมีความแม่นยำสูงเรื่องตัวเลขเงิน
- **การใช้หน่วยเงิน:** แสดงสัญลักษณ์ `฿` ต่อท้ายจำนวนเงินเสมอ เช่น `60 ฿`, `+10 ฿` และใช้ `font-mono tabular-nums`
- **การแปลงหน่วย:** ใช้ฟังก์ชันกลาง `formatPrice(amount)` จาก `src/lib/utils/price.ts` เท่านั้น ห้ามเขียนสตริงติด `฿` หรือ `.toFixed(2)` เองในคอมโพเนนต์
