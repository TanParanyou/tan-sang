# Tan-Sang Development Guidelines & Rules

## 1. Centralized Shared Utilities (ฟังก์ชันกลาง & Single Source of Truth)
- **ห้ามคัดลอกตรรกะซ้ำซ้อน (Strict DRY):** เมื่อมีตรรกะการจัดรูปแบบ (formatting), การแปลงหน่วย/สกุลเงิน, หรือการจัดการข้อความ fallback ที่ต้องใช้งานมากกว่า 1 จุด (เช่น Web UI, สลิปพิมพ์, ข้อความส่งร้าน, LINE Flex Message, คัดลอกลง Clipboard) **ต้องสร้างเป็นฟังก์ชันกลางใน `src/lib/utils/` หรือ Service กลางเสมอ**
- **ห้ามเขียน inline conditional ซ้ำๆ:** หลีกเลี่ยงการเขียน ternary expression สำหรับแปลงค่าการแสดงผลเดียวกันกระจายตาม components ต่างๆ เพื่อป้องกันความไม่สอดคล้องกัน (inconsistency) และให้ง่ายต่อการแก้ไขในอนาคต
