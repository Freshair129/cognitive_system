---
id: RUNBOOK--OBSIDIAN-METADATA-SETUP
title: Obsidian Metadata Setup Guide
cluster: ops
role: Operational response guide
crosslinks:
  depends_on:
    - PARAMS--METADATA-SETUP-PROFILE01
  references:
    - CONCEPT--OBSIDIAN-METADATA-DESIGN
attributes:
  domain: operations
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: false
  leak_risk: low
  encryption_level: none
---

# RUNBOOK — Obsidian Metadata Setup Guide

เอกสารนี้อธิบายขั้นตอนการกำหนด **front‑matter metadata** ในไฟล์ Markdown ของ Obsidian เพื่อให้ระบบ **Cross‑Link** ของ GKS สามารถแสดง property ต่าง ๆ (domain, source_type, created_at, summary ฯลฯ) อย่างถูกต้อง

## Trigger
- สร้างหรือแก้ไขโน้ต Obsidian ใหม่ที่ต้องการให้ปรากฏใน Cross‑Link
- พบว่าข้อมูลเมตาดาต้าไม่แสดงหรือแสดงค่าเป็น `null`/`undefined`
- ระบบ `npm run msp:validate` รายงานข้อผิดพลาดเกี่ยวกับ front‑matter schema

## Response steps

### 1️⃣ ตรวจสอบ Schema (`atom_schema.yaml`)
1. เปิดไฟล์ `atom_schema.yaml` ที่โครงการราก (`c:/Users/freshair/cognitive_system/atom_schema.yaml`)
2. ยืนยันว่าฟิลด์ต่อไปนี้อยู่ใน `AtomicEntry`:
   - `domain: string`
   - `source_type: string`
   - `created_at: string` – ต้องเป็น ISO‑8601 พร้อม **+07:00** offset
   - `summary?: string`
   - `tags?: string[]`
   - `attributes?: object` (สำหรับ `salient`, `trigger`, `hook` เป็นต้น)

> **Why?**
These fields are required by the Cross‑Link renderer. If any field is missing, the UI falls back to the minimal `MENTION` tier and will not display the richer information you expect.

### 2️⃣ ปรับ Front‑Matter ของโน้ต Obsidian
ในแต่ละไฟล์ Markdown ของ Obsidian ให้เพิ่มหรืออัปเดตบล็อก YAML header ดังนี้ (ตัวอย่าง):

```yaml
---
id: CONCEPT--NOTE-EXAMPLE
title: ตัวอย่างโน้ต
domain: knowledge            # ค่าที่ต้องการให้แสดงใน Cross‑Link
source_type: gks             # gks | msp | external
created_at: 2026-05-28T13:45:00.000+07:00   # เวลาที่สร้าง (ต้องมี +07:00)
summary: สรุปสั้น ๆ ของโน้ต เพื่อแสดงใน tier SUMMARY
tags:
  - onboarding
  - security
attributes:
  salient: "จุดสำคัญของโน้ต"
  trigger: "เมื่อเกิดเหตุการณ์ X"
  hook: "ลิงก์ย้อนกลับไปยังโน้ตต้นทาง"
---
```

#### รายละเอียดของแต่ละฟิลด์
| ฟิลด์ | ประเภท | รายละเอียด | ค่าที่แนะนำ |
|------|--------|------------|------------|
| **id** | string (ต้องตรงกับ ID ของ Atom) | ตัวระบุที่ไม่ซ้ำ, ใช้ใน Cross‑Link | `CONCEPT--YOUR‑NOTE` |
| **title** | string | ชื่อที่จะแสดงใน tooltip / hover | ใส่ชื่ออ่านง่าย |
| **domain** | string | หมวดหมู่หลักของข้อมูล, ใช้จัดกลุ่มใน UI | `knowledge`, `policy`, `operations` |
| **source_type** | string | แหล่งที่มาของ Atom (ทำให้ UI ใส่ไอคอน) | `gks` (default), `msp`, `external` |
| **created_at** | string (ISO‑8601) | เวลา UTC+07:00, ใช้ในการเรียงลำดับและแสดง badge | `2026-05-28T13:45:00.000+07:00` |
| **summary** | string (optional) | คำอธิบายสั้น ๆ ที่แสดงใน tier `SUMMARY` | คำอธิบาย 1‑2 ประโยค |
| **tags** | string[] (optional) | รายการ tag เพื่อกรอง/ค้นหา | `["onboarding","security"]` |
| **attributes** | object (optional) | คีย์‑ค่าเพิ่มเติมที่ UI สามารถอ่านได้ (salient, trigger, hook ฯลฯ) | `salient: "…", trigger: "…"` |

### 3️⃣ รัน Validation
```bash
npm run msp:validate
```
- หากไม่มี error → Metadata ถูกต้องและพร้อมใช้งานใน Cross‑Link
- หากมี error → แก้ไขตามข้อความที่แสดง (เช่น “missing required property `domain`”)

### 4️⃣ รีบิลด์ GKS (จำเป็นเมื่อเพิ่มฟิลด์ใหม่ใน Schema)
```bash
npm run build --workspace=packages/gks
```

### 5️⃣ ตรวจสอบผลใน UI
1. เริ่ม UI ถ้ายังไม่ได้ทำ  
   ```bash
   npm run dev --workspace=packages/ui
   ```
2. เปิดหน้า **Cross‑Link Viewer** หรือ **Atom Detail** ในเบราว์เซอร์
3. Hover ที่โน้ตที่แก้ไข → ควรเห็น:
   - Domain badge
   - Source‑type icon
   - Created‑at timestamp
   - Summary (เมื่ออยู่ใน tier `SUMMARY`)
   - Custom attributes (ถ้ามี)

### 6️⃣ เอกสารอ้างอิง
- **atom_schema.yaml** – สเปคการกำหนด front‑matter (`file:///c:/Users/freshair/cognitive_system/atom_schema.yaml`)
- **PARAMS--METADATA-SETUP-PROFILE01** – รายละเอียดค่าเริ่มต้นที่แนะนำ (ด้านล่าง)

---

*End of Runbook*
