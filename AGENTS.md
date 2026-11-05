# Tan-Sang Development Guidelines & Rules

## 1. Centralized Shared Utilities (ฟังก์ชันกลาง & Single Source of Truth)
- **ห้ามคัดลอกตรรกะซ้ำซ้อน (Strict DRY):** เมื่อมีตรรกะการจัดรูปแบบ (formatting), การแปลงหน่วย/สกุลเงิน, หรือการจัดการข้อความ fallback ที่ต้องใช้งานมากกว่า 1 จุด (เช่น Web UI, สลิปพิมพ์, ข้อความส่งร้าน, LINE Flex Message, คัดลอกลง Clipboard) **ต้องสร้างเป็นฟังก์ชันกลางใน `src/lib/utils/` หรือ Service กลางเสมอ**
- **ห้ามเขียน inline conditional ซ้ำๆ:** หลีกเลี่ยงการเขียน ternary expression สำหรับแปลงค่าการแสดงผลเดียวกันกระจายตาม components ต่างๆ เพื่อป้องกันความไม่สอดคล้องกัน (inconsistency) และให้ง่ายต่อการแก้ไขในอนาคต

## 2. Centralized Assets & Branding Management (การจัดการ Asset และโลโก้)
- **ห้ามแก้ไขกระจายจุด (No Scattered Edits):** เมื่อมีการเปลี่ยนโลโก้, Favicon หรือภาพแสดงเมื่อแนบลิงก์ (Open Graph Banner) **ต้องอัปเดตที่ไฟล์ Asset กลางใน `public/` (เช่น `public/og.png`, `public/logo.png`) และ Config กลาง (`src/config/site.ts`) เท่านั้น**
- **ห้าม Hardcode แก้ไขใน Components/Routes ย่อย:** ห้ามแก้ URL, พารามิเตอร์แคช (`?v=...`) หรือเปลี่ยนแท็กรูปภาพกระจายตาม Components หรือ API Webhook ย่อยโดยไม่จำเป็น เพื่อรักษาความเป็นระเบียบและให้ระบบดึงค่าจาก Config กลางเสมอ

