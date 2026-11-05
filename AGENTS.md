# Tan-Sang Development Guidelines & Rules (Minimal & Pragmatic)

> กฎการพัฒนาสำหรับ Tan-Sang (ตาลสั่ง): เว็บแอปสั่งอาหารกลุ่มผ่าน LINE LIFF ขนาดกะทัดรัด เน้นความคล่องตัว ใช้งานง่ายบนมือถือ และข้อมูลถูกต้องแม่นยำ

---

## 1. Centralized Shared Utilities (ฟังก์ชันกลาง & Single Source of Truth)
- **ห้ามคัดลอกตรรกะซ้ำซ้อน (Strict DRY):** เมื่อมีตรรกะการจัดรูปแบบ (formatting), การแปลงหน่วย/สกุลเงิน, หรือการจัดการข้อความ fallback ที่ต้องใช้งานมากกว่า 1 จุด (เช่น Web UI, สลิปพิมพ์, ข้อความส่งร้าน, LINE Flex Message, คัดลอกลง Clipboard) **ต้องสร้างเป็นฟังก์ชันกลางใน `src/lib/utils/` หรือ Service กลางเสมอ**
- **ห้ามเขียน inline conditional ซ้ำๆ:** หลีกเลี่ยงการเขียน ternary expression สำหรับแปลงค่าการแสดงผลเดียวกันกระจายตาม components ต่างๆ เพื่อป้องกันความไม่สอดคล้องกัน (inconsistency)

## 2. Centralized Assets & Branding Management (การจัดการ Asset และโลโก้)
- **ห้ามแก้ไขกระจายจุด (No Scattered Edits):** เมื่อมีการเปลี่ยนโลโก้, Favicon หรือภาพแสดงเมื่อแนบลิงก์ (Open Graph Banner) **ต้องอัปเดตที่ไฟล์ Asset กลางใน `public/` (เช่น `public/og.png`, `public/logo.png`) และ Config กลาง (`src/config/site.ts`) เท่านั้น**
- **ห้าม Hardcode แก้ไขใน Components/Routes ย่อย:** ห้ามแก้ URL, พารามิเตอร์แคช (`?v=...`) หรือเปลี่ยนแท็กรูปภาพกระจายตาม Components เพื่อรักษาความเป็นระเบียบและให้ระบบดึงค่าจาก Config กลางเสมอ

## 3. Architecture Boundaries & Clean Separation (สถาปัตยกรรมระดับพอเหมาะ)
- **การแยกส่วนหน้าที่:**
  - `src/features/*`: UI Components, Schemas (Zod), และ Feature-specific client hooks
  - `src/server/services/*`: Core Domain & Business Logic (การคำนวณยอด, สรุปส่งร้าน, กฎการปิดบิล)
  - `src/server/repositories/*`: การเข้าถึงฐานข้อมูล (Supabase / In-Memory Fallback สำหรับ Dev)
  - `src/server/http/*`: การจัดการ Response และ Error handling
- **Error Handling:**
  - ใช้ `DomainError` พร้อม Error Code ชัดเจนสำหรับ Business Invariant
  - ส่ง HTTP Response ที่มี Error Code และข้อความที่ผู้ใช้อ่านเข้าใจง่าย

## 4. Session Integrity & Host Authority (ความปลอดภัยของข้อมูลรอบบิล)
- **One Active Session Guard:** ใน 1 กลุ่ม LINE (`line_group_id`) มีบิลเปิดได้เพียง 1 บิล (`status === 'OPEN'`) เท่านั้น
- **Session Locking Guard:** เมื่อบิลถูกปิดแล้ว (`status === 'CLOSED'`) ต้องบล็อกการเพิ่ม/แก้ไข/ลบรายการอาหารทันที
- **Host Authority:** มีเพียงผู้เปิดบิล (`host_user_id`) เท่านั้นที่สามารถกดปิดบิลหรือลบบิลได้

## 5. Mobile-First Token UX & LINE LIFF Ergonomics
- **No Hardcoded Style Values:** ใช้คลาส Tailwind ที่ผูกกับ Token เสมอ (`bg-canvas`, `text-ink`, `border-hairline`, `bg-line`) ตามที่ระบุใน `DESIGN.md`
- **Thumb-Friendly Touch Targets:** ปุ่มและช่องกรอกสำหรับใช้งานบนมือถือต้องมีขนาดความสูงอย่างน้อย **44px** (`min-h-[44px]`) เพื่อให้กดง่ายด้วยนิ้วโป้งใน LINE Webview
- **Tabular Precision:** ตัวเลขเงินและจำนวนชิ้นต้องใช้ `font-mono tabular-nums` เสมอ เพื่อการจัดเรียงที่ตรงหลักเหมือนใบเสร็จ
- **Double-Submit Protection:** ทุกปุ่ม Submit หรือ Action สำคัญ (เช่น ยืนยันเพิ่มอาหาร, ปิดบิล, ลบรายการ) ต้องมีสถานะ `loading` และล็อกการคลิกซ้ำ (`disabled={loading}`)

## 6. Multi-Language & i18n Standards (มาตรฐานระบบสองภาษา TH/EN)
- **Static UI Strings:** ข้อความแสดงผลบนหน้าจอ (ปุ่ม, ป้ายกำกับ, สถานะ, หัวข้อ) ต้องเรียกใช้ผ่าน `useI18n()` (`t.*`) จาก `@/lib/i18n/i18n-context` เสมอ หลีกเลี่ยงการ Hardcode ข้อความภาษาไทยหรืออังกฤษลงใน JSX โดยตรง
- **Strict Translation Pair:** เมื่อเพิ่มหรือแก้ไขข้อความใน `src/messages/th.ts` ต้องเพิ่มคู่เทียบใน `src/messages/en.ts` ให้ครบถ้วนเสมอ โดยมี Unit Test (`src/test/i18n.test.ts`) คอยตรวจสอบความตรงกันของคีย์ 100%
- **Dynamic Database Content:** สำหรับข้อมูลจากฐานข้อมูลที่เป็น JSONB สองภาษา (ชื่อร้าน, ชื่อเมนู, ตัวเลือกท็อปปิ้ง) ต้องใช้ฟังก์ชันกลาง `getLocalizedText(entity.name, locale)` จาก `@/lib/utils/i18n.schema` เพื่อจัดการการแสดงผลพร้อมระบบ Fallback สู่ภาษาไทยอัตโนมัติ

## 7. Verification & Quality Gates (การทดสอบก่อนส่งมอบงาน)
ก่อนที่จะยืนยันว่างานเสร็จสิ้น ต้องรันคำสั่งตรวจสอบเหล่านี้และต้องผ่าน 100%:
1. `npx vitest run` — ผ่านทุก Test Suite ครบถ้วน
2. `npx tsc --noEmit` — ไม่มีข้อผิดพลาด Type ใดๆ
