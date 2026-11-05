---
name: business-document-numbering
description: คู่มือสร้างและจัดการระบบออกเลขที่เอกสารแบบ Zero-Collision Concurrency ด้วย PostgreSQL Atomic UPSERT สำหรับบิลอาหารและใบเสร็จใน Tan-Sang
---

# Business Document Numbering (Zero-Collision Concurrency Engine)

## 📌 วัตถุประสงค์
ป้องกันปัญหาเลขที่เอกสารซ้ำกัน (ID Collision) หรือเลขกระโดดเมื่อมีผู้ใช้เปิดบิลหรือสร้างเอกสารพร้อมกัน (High Concurrency) โดยใช้เทคนิค **PostgreSQL Atomic UPSERT** (`INSERT ... ON CONFLICT (scope, doc_type, period) DO UPDATE SET last_number = last_number + 1 RETURNING last_number`)

## 🛠️ โครงสร้าง Sequence
```sql
CREATE TABLE IF NOT EXISTS public.document_sequences (
    scope VARCHAR(64) NOT NULL,       -- เช่น LINE Group ID หรือ STORE ID หรือ 'GLOBAL'
    doc_type VARCHAR(32) NOT NULL,    -- เช่น 'SESSION', 'RECEIPT', 'BILL'
    period VARCHAR(32) NOT NULL,      -- เช่น '202611' (รายเดือน), '2026' (รายปี), 'FOREVER'
    last_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, doc_type, period)
);
```

## 🎯 รูปแบบ Token Syntax
- `{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}` $\rightarrow$ `TS-REC-2611-0001`
- `{PREFIX}-{SEQ:4}` $\rightarrow$ `BILL-0001`
- `{YEAR:YYYY}{MONTH:MM}{DAY:DD}-{SEQ:3}` $\rightarrow$ `20261105-001`

## 💻 การเรียกใช้งานในโค้ด
ใช้ `NumberingEngine` จาก `@/server/sequences/numbering-engine`:
```ts
import { numberingEngine } from '@/server/sequences/numbering-engine';

const sessionCode = await numberingEngine.nextNumber({
  scope: 'TS',
  docType: 'SESSION',
  periodFormat: 'YYYYMM',
  template: '{SCOPE}-{TYPE}-{YEAR:YY}{MONTH:MM}-{SEQ:4}',
});
// ได้ผลลัพธ์: "TS-SESSION-2611-0001"
```
