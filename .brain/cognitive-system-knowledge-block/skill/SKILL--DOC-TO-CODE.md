---
id: SKILL--DOC-TO-CODE
phase: 2
type: skill
status: stable
vault_id: default
tier: process
source_type: learned
title: "Doc-to-Code Skill"
summary: ทักษะความสามารถของ Agent ในการแปลงเอกสารสเปก (Markdown/Text) ให้กลายเป็นโค้ดภาษาคอมพิวเตอร์อย่างแม่นยำ
tags:
  - skill
  - doc-to-code
  - codegen
created_at: 2026-06-02T20:13:00.000+07:00
cluster: ops
role: Agent capability
crosslinks:
  references:
    - "[[CONCEPT--DOC-DRIVEN-DEVELOPMENT]]"
  parent_blueprint:
    - "[[GENESIS--COGNITIVE-ENGINE]]"
---

# 🛠️ SKILL--DOC-TO-CODE

**Doc-to-Code Capability**
ทักษะระดับปฏิบัติการ (Execution Skill) ของ AI Agent ซึ่งเป็นผลผลิตโดยตรงจากปรัชญา `[[CONCEPT--DOC-DRIVEN-DEVELOPMENT]]`

## **1. Capability Definition (คำจำกัดความของทักษะ)**
ทักษะที่เปลี่ยนบทบาทของ AI ให้เป็น "Compiler" ที่สามารถรับ Input เป็นภาษามนุษย์ที่มีโครงสร้าง (Structured Markdown, YAML) และคาย Output ออกมาเป็นภาษาโปรแกรม (Code) ได้อย่างแม่นยำ 100% 

## **2. Execution Trigger (เมื่อใดที่ควรใช้ทักษะนี้?)**
*   เมื่อผ่าน **Phase 2 (Architecture)** มาเรียบร้อย และเริ่มเข้าสู่ **Phase 3 (Assembly)**
*   เมื่อผู้ใช้งานสร้างไฟล์เอกสารสเปก (เช่น `FEAT--LOGIN.md`) เสร็จสิ้น และสั่งให้ Agent สร้างโค้ด (เช่น `Login.tsx`) จากสเปกนั้น

## **3. Agent Execution Standard (มาตรฐานการทำงาน)**
1.  **Read SSOT:** อ่านไฟล์เอกสาร Markdown (Single Source of Truth) อย่างละเอียด
2.  **Constraint Check:** ตรวจสอบข้อห้ามหรือกติกาที่เขียนไว้ในเอกสาร
3.  **Generate:** เขียนโค้ดตามสเปกเป๊ะๆ โดยห้ามคิดลอจิกเพิ่มเติมขึ้นมาเองแบบสุ่มสี่สุ่มห้า (No Hallucination allowed)
