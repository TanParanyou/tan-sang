---
name: building-business-lists
description: คู่มือสร้างหน้าตารางและรายการข้อมูลระดับ Enterprise UX ใน Tan-Sang ครอบคลุม 2-Tier Filter Toolbar, URL State Sync (useListState), และ Data Pagination
---

# Building Business Lists (Enterprise List & Table UX Standards)

## 📌 สถาปัตยกรรม 2-Tier Architectural Filter Toolbar
หน้าแสดงรายการหรือตารางข้อมูล (เช่น หน้ารายการร้านค้า, ประวัติการสั่งอาหาร, หรือรายการบิลย้อนหลัง) ต้องจัดโครงสร้างเป็น 2 ระดับ:

- **Tier 1 (Primary Toolbar):**
  - ฝั่งซ้าย: กล่องค้นหาหลัก (`ListSearchInput`) มีปุ่มเคลียร์ข้อความเมื่อมีข้อความ
  - ฝั่งขวา: ปุ่ม Action หลัก (เช่น "สร้างร้านใหม่", "ส่งออกรายงาน", "สลับมุมมอง")
- **Tier 2 (Filter Grid & Active Chips):**
  - ตัวกรองสม่ำเสมอ 4 คอลัมน์ (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) สำหรับ Select หรือ Date Range
  - แถบชิปสรุปตัวกรองที่เลือก (`ActiveFilterChips`) พร้อมปุ่มล้างตัวกรองทั้งหมด ("Clear all")

## 🔄 URL State Synchronization (`useListState`)
- ทุกการค้นหา (search), การเลือกตัวกรอง (filter), การจัดเรียง (sort) และการเปลี่ยนหน้า (page) ต้อง Sync ลงใน URL Query Parameters เสมอ เพื่อให้ผู้ใช้สามารถคัดลอก URL หรือกดปุ่ม Back/Forward ในเบราว์เซอร์ได้โดยข้อมูลไม่หาย
