---
name: building-business-apis
description: คู่มือสร้างและออกแบบ API ตามมาตรฐาน Enterprise: RFC 9457 Problem Details, Result Pattern, Context Extraction, และ Deterministic Pagination ใน Tan-Sang
---

# Building Business APIs (Enterprise API Standards)

## 📌 มาตรฐานการสร้าง API ใน Tan-Sang
1. **RFC 9457 Problem Details:**
   - Error Response ทั้งหมดต้องส่งตามรูปแบบ Problem Details มาตรฐาน
   - มี `type`, `title`, `status`, `detail`, `code`, และ `instance`
   - ใช้ `handleApiError(error)` หรือ `toProblemDetails(error)` จาก `@/server/http/api-response`
2. **Result Pattern ใน Service Layer:**
   - ภายใน Application/Service Layer ใช้ `Result<T, DomainError>` เพื่อคุม Flow ปราศจากการ throw Unhandled Exception
   - `ok(data)` สำหรับความสำเร็จ
   - `err(error)` สำหรับข้อผิดพลาดเชิงธุรกิจ
3. **RequestContext Scoped Service:**
   - ดึงข้อมูล `correlationId`, `userId`, `lineGroupId` จาก Request Header ผ่าน `createRequestContext(req)`
   - บันทึก `correlationId` ใน Error logs และ Response Header เพื่อการสืบย้อน (Traceability)
4. **Deterministic Pagination:**
   - ใช้ Parameters มาตรฐาน: `page`, `pageSize`, `search`, `sortBy`, `sortDirection`
   - Response โครงสร้างมาตรฐาน: `{ items: T[], total: number, page: number, pageSize: number, totalPages: number }`
