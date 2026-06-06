---
id: ADR--TAXONOMY-CAPABILITY-SYMMETRY
phase: 2
type: adr
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "ADR: Taxonomy & Capability Symmetry Standard"
summary: บันทึกการตัดสินใจกำหนดมาตรฐานความต่างระหว่าง CONCEPT (ปรัชญา) และ SKILL (ทักษะปฏิบัติ) เพื่อแก้ปัญหาความไม่สมมาตรของ Taxonomy
tags:
  - adr
  - architecture-decision
  - taxonomy
created_at: 2026-06-02T20:13:00.000+07:00
cluster: governance
role: Architecture Decision Record
crosslinks:
  resolves:
    - "ISSUE--ASYMMETRIC-TAXONOMY"
  references:
    - "CONCEPT--DOC-DRIVEN-DEVELOPMENT"
    - "SKILL--DOC-TO-CODE"
    - "SKILL--DIAGRAM-TO-CODE"
---
# 🏛️ ADR--TAXONOMY-CAPABILITY-SYMMETRY

**Architecture Decision Record: Taxonomy & Capability Symmetry**
**Date:** 2026-06-02
**Status:** Accepted

## **1. Context (บริบทของปัญหา)**
อ้างอิงจาก `[[ISSUE--ASYMMETRIC-TAXONOMY]]` ระบบพบความสับสนในการใช้คำนำหน้า (Prefix) ระหว่าง `CONCEPT--` และ `SKILL--` ส่งผลให้ระบบฐานความรู้ (Knowledge Graph) เสียสมดุล

## **2. Decision (การตัดสินใจ)**
คณะกรรมการสถาปัตยกรรม (System Architect) อนุมัติกฎเกณฑ์ใหม่สำหรับการสร้าง GKS Taxonomy ดังนี้:

*   **Rule 1: The Paradigm (ร่มปรัชญา):**
    คำนำหน้า `CONCEPT--` จะต้องถูกใช้กับ "ปรัชญา แนวคิดเชิงนามธรรม หรือกลยุทธ์" เท่านั้น (เช่น Doc-Driven Development) มันคือ "เหตุผลที่ต้องทำ (The Why)"
*   **Rule 2: The Execution (เครื่องมือปฏิบัติ):**
    คำนำหน้า `SKILL--` จะต้องถูกใช้กับ "ทักษะ ความสามารถ หรือเครื่องมือของ AI Agent" เท่านั้น (เช่น Doc-to-Code, Diagram-to-Code) มันคือ "วิธีการทำ (The How)"

## **3. Consequences (ผลที่ตามมา / การนำไปปฏิบัติ)**
1.  **Keep:** คงไฟล์ `[[CONCEPT--DOC-DRIVEN-DEVELOPMENT]]` ไว้ในฐานะปรัชญาหลัก (SSOT Strategy)
2.  **Create:** สร้างไฟล์ `[[SKILL--DOC-TO-CODE]]` เพื่อทำหน้าที่เป็นทักษะคู่ขนาน (Sister Skill) ของ `[[SKILL--DIAGRAM-TO-CODE]]`
3.  **Update:** จัดโครงสร้างใน `GENESIS--COGNITIVE-ENGINE` ใหม่ ให้สะท้อนความสัมพันธ์แบบแม่ลูก (Parent-Child Concept/Skill tree)


## Context

## Decision

## Consequences
