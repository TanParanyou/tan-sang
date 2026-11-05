# Tan-Sang Development Guidelines & Rules

## 1. Centralized Shared Utilities (ฟังก์ชันกลาง & Single Source of Truth)
- **ห้ามคัดลอกตรรกะซ้ำซ้อน (Strict DRY):** เมื่อมีตรรกะการจัดรูปแบบ (formatting), การแปลงหน่วย/สกุลเงิน, หรือการจัดการข้อความ fallback ที่ต้องใช้งานมากกว่า 1 จุด (เช่น Web UI, สลิปพิมพ์, ข้อความส่งร้าน, LINE Flex Message, คัดลอกลง Clipboard) **ต้องสร้างเป็นฟังก์ชันกลางใน `src/lib/utils/` หรือ Service กลางเสมอ**
- **ห้ามเขียน inline conditional ซ้ำๆ:** หลีกเลี่ยงการเขียน ternary expression สำหรับแปลงค่าการแสดงผลเดียวกันกระจายตาม components ต่างๆ เพื่อป้องกันความไม่สอดคล้องกัน (inconsistency) และให้ง่ายต่อการแก้ไขในอนาคต

## 2. Centralized Assets & Branding Management (การจัดการ Asset และโลโก้)
- **ห้ามแก้ไขกระจายจุด (No Scattered Edits):** เมื่อมีการเปลี่ยนโลโก้, Favicon หรือภาพแสดงเมื่อแนบลิงก์ (Open Graph Banner) **ต้องอัปเดตที่ไฟล์ Asset กลางใน `public/` (เช่น `public/og.png`, `public/logo.png`) และ Config กลาง (`src/config/site.ts`) เท่านั้น**
- **ห้าม Hardcode แก้ไขใน Components/Routes ย่อย:** ห้ามแก้ URL, พารามิเตอร์แคช (`?v=...`) หรือเปลี่ยนแท็กรูปภาพกระจายตาม Components หรือ API Webhook ย่อยโดยไม่จำเป็น เพื่อรักษาความเป็นระเบียบและให้ระบบดึงค่าจาก Config กลางเสมอ

## 3. Architecture Boundaries & Clean Separation (สถาปัตยกรรมและการแบ่ง Layer)
- **การแยกส่วนหน้าที่ชัดเจน:**
  - `src/features/*`: UI Components, Schemas (Zod), และ Feature-specific client hooks
  - `src/server/services/*`: Core Domain & Business Logic (เช่น การคำนวณยอด, การสรุปส่งร้าน, กฎการปิดบิล)
  - `src/server/repositories/*`: การเข้าถึงฐานข้อมูล (Supabase / In-Memory Fallback)
  - `src/server/http/*`: การแปลง Error (RFC 9457 Problem Details) และ Response serialization
- **Result Pattern & Error Handling:**
  - ใช้ `Result<T, E>` สำหรับควบคุม Flow ภายใน Service Layer
  - หลีกเลี่ยงการโยน `throw new Error()` พร่ำเพรื่อ หากเป็นข้อผิดพลาดทางธุรกิจให้ใช้ `DomainError` หรือ `Result.err()`
  - ส่ง HTTP Response สอดคล้องกับมาตรฐาน RFC 9457 Problem Details พร้อม Error Code ที่นิยามไว้ใน `src/server/errors/domain.error.ts`

## 4. Atomic Upsert & Concurrency Safety (ความปลอดภัยในการจัดการข้อมูล)
- **Zero-Collision Numbering:** การออกเลขที่เอกสาร รหัสใบเสร็จ หรือลำดับรายการ ต้องใช้กลไก PostgreSQL Atomic UPSERT ผ่านฟังก์ชัน `next_document_sequence` หรือ `NumberingEngine` ห้ามใช้วิธี `SELECT MAX() + 1` เด็ดขาดเพื่อป้องกันเลขซ้ำเมื่อมีผู้ใช้งานพร้อมกัน
- **Session Locking Guard:** ทุก Mutation ที่กระทบ `order_items` ต้องผ่านการตรวจสอบสถานะ `status === 'OPEN'` เสมอ หากปิดบิลแล้วต้องบล็อกการแก้ไขทันที

## 5. Token-Driven UX System & Input Harmony (ระบบ Token และความสอดคล้องของ UI)
- **No Hardcoded Style Values:** ห้ามใส่ค่าสี Hex แบบ Hardcode (เช่น `#FAF8F5`, `#362520`) หรือขนาด `border-radius: 8px` ใน Component โดยตรง ให้ใช้คลาส Tailwind ที่ผูกกับ CSS Variables เสมอ (`bg-canvas`, `text-ink`, `rounded-theme`, `border-hairline`)
- **Strict Control Height Harmony:** ช่องกรอกข้อมูล (`Input`, `Select`) และปุ่ม Action ที่วางอยู่ในแถวหรือระนาบเดียวกัน ต้องมีความสูงเท่ากันตาม Density Token (`compact`: 36px, `comfortable`: 40px, `spacious`: 44px) ห้ามมีปุ่มและช่องกรอกสูงเหลื่อมกัน
- **Double-Submit Protection:** ทุกปุ่ม Submit หรือสั่งการสำคัญ (เช่น ปิดบิล, ลบรายการ, บันทึกร้าน) ต้องมีสถานะ `loading` และล็อกการคลิกซ้ำ (`disabled={loading}`)

## 6. Deferred File Upload Pattern (การอัปโหลดไฟล์แบบชะลอส่ง)
- **ห้ามส่งไฟล์ขึ้น Server ทันทีที่เลือก:** เมื่อผู้ใช้แนบรูปภาพ (เช่น สลิปโอนเงิน หรือรูปเมนูอาหาร) ให้สร้าง Local Object URL (`URL.createObjectURL`) สำหรับแสดง Preview ก่อนเสมอ
- **อัปโหลดเมื่อกด Submit เท่านั้น:** ยิง Request อัปโหลดไปยัง `IFileStorageService` เมื่อผู้ใช้กดยืนยันบันทึกฟอร์ม เพื่อป้องกันขยะไฟล์ตกค้างใน Storage หากผู้ใช้กดยกเลิก

## 7. Verification & Quality Gates (การทดสอบก่อนส่งมอบงาน)
ก่อนที่จะยืนยันว่างานเสร็จสิ้น ต้องรันคำสั่งตรวจสอบเหล่านี้และต้องผ่าน 100%:
1. `npx vitest run` — ผ่านทุก Test Suite ครบถ้วน
2. `npx tsc --noEmit` — ไม่มีข้อผิดพลาด Type ใดๆ
