---
id: CONCEPT--DOC-DRIVEN-DEVELOPMENT
phase: 1
type: concept
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "Doc-Driven Development (DDD)"
summary: ปรัชญาการพัฒนาซอฟต์แวร์แบบ Specification-to-System ที่ถือว่า "เอกสารคือความจริงเดียว (SSOT)" โดยบังคับให้เขียนเอกสารความตั้งใจก่อนเขียนโค้ดเสมอ
tags:
  - concept
  - methodology
  - doc-driven
created_at: 2026-06-02T20:13:00.000+07:00
cluster: implementation_flow
role: Strategic intent / PRD
crosslinks:
  references:
    - "FRAMEWORK--WORKFLOW-DYNAMICS"
    - "CONCEPT--SPECIFICATION-TO-SYSTEM"
    - "ADR--DOC-TO-CODE-ENFORCEMENT"
    - "ADR--MASTER-PROMOTION-DOC-TO-CODE"
  parent_blueprint:
    - "GENESIS--COGNITIVE-ENGINE"
---
# 📝 CONCEPT--DOC-DRIVEN-DEVELOPMENT

**Doc-Driven Development (DDD) / Specification-to-System**
แนวทางปรัชญาเชิงกลยุทธ์ที่เป็น "หัวใจ" ของการพัฒนาโค้ดร่วมกับ AI Agent

## **1. The Flaw of Traditional Coding (ปัญหาของวิธีการเดิมๆ)**
ในอดีต มนุษย์และ AI มักมีพฤติกรรมเขียนโค้ดลงไปก่อน (Code-first) แล้วค่อยหวังว่าจะจำมันได้ หรือทำเอกสารตามทีหลัง (ซึ่งมักจะไม่เกิด) 
**ผลลัพธ์:** เกิด Technical Debt จำนวนมหาศาล โค้ดกลายเป็น Legacy เร็วเกินไป และ AI ยุคหลังที่เข้ามาอ่านโค้ดเกิดอาการ "หลอน (Hallucination)" เพราะไม่รู้เจตนารมณ์ที่แท้จริง (Intent) ของผู้เขียน

## **2. The Concept (แนวคิด Doc-Driven)**
**"Document is the single source of truth (SSOT). Code is just a byproduct."**
(เอกสารคือความจริงเพียงหนึ่งเดียว โค้ดเป็นแค่ผลผลิตพลอยได้)

*   เราปฏิบัติต่อ AI Agent เสมือนเป็น **Compiler ชั้นสูง** 
*   มนุษย์และ AI จะต้องร่วมกันเขียนเอกสารภาษาคน (Markdown / YAML) เพื่อระบุ Business Logic, Constraints และ Architecture ให้เสร็จสิ้นสมบูรณ์ (Specification)
*   เมื่อสเปกชัดเจน AI จะทำการ "Compile" (หรือ Generate) ภาษา Markdown เหล่านั้นให้ออกมาเป็นโค้ด `TypeScript`, `Python`, หรือ `HTML` โดยอัตโนมัติ (System)

## **3. The Validation Rule (กฎการตรวจสอบ)**
เพื่อให้สอดคล้องกับ [[FRAMEWORK--WORKFLOW-DYNAMICS]] (Phase 1-7):
*   โค้ดระดับ `Feature (L2)` หรือ `Component (L1)` ทุกชิ้น **ต้องมีไฟล์ Markdown กำกับอยู่เสมอ**
*   ห้ามมีโค้ดลอยๆ ที่ไม่มีเอกสารอธิบายเจตนารมณ์อ้างอิงกลับมาที่ GKS อย่างเด็ดขาด
