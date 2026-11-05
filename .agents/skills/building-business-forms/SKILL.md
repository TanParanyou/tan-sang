---
name: building-business-forms
description: คู่มือสร้างฟอร์มระดับ Enterprise UX ใน Tan-Sang ครอบคลุม FormTabs พร้อม Red Dot Error, Input Height Harmony, และ Deferred File Upload
---

# Building Business Forms (Enterprise Form UX Standards)

## 📌 มาตรฐานการสร้างฟอร์มในระบบ
1. **Input Height Harmony (ความสูงสม่ำเสมอ):**
   - ทุก Input, Select, และ Button ในแถวเดียวกัน ต้องมีความสูงเท่ากันตาม Density Token (`compact`: 36px, `comfortable`: 40px, `spacious`: 44px)
   - ห้ามเขียน style หรือ h-12 ผสมกับ h-9 ในแถวเดียวกัน
2. **FormTabs with Red Dot Error:**
   - ฟอร์มที่มีหลายกลุ่มข้อมูล (เช่น จัดการข้อมูลร้าน: ข้อมูลทั่วไป, เมนูอาหาร, ตัวเลือกท็อปปิ้ง) ให้ใช้แท็บ `FormTabs`
   - เมื่อกด Submit แล้วข้อมูลในแท็บใดไม่ผ่าน Validation ต้องมี **จุดเตือนสีแดง (Red Dot)** แสดงบนหัวแท็บนั้น และระบบจะกระโดดไปแท็บแรกที่มี Error อัตโนมัติ
3. **Deferred File Upload Pattern:**
   - เมื่อเลือกรูปภาพ (เช่น สลิปโอนเงิน หรือรูปหน้าร้าน) ต้องสร้าง Local Preview ด้วย `useDeferredFileUpload`
   - **ห้าม** ยิง API อัปโหลดไฟล์ขึ้น Storage ทันทีที่เลือก ให้รอจนกว่าผู้ใช้จะกดบันทึก (Submit) ฟอร์ม
4. **Double-Submit Protection:**
   - ปุ่ม Submit ต้องมี `loading={isSubmitting}` และสั่ง `disabled={isSubmitting}` เพื่อป้องกันการส่งคำขอซ้ำซ้อน
