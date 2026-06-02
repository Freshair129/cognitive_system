---
id: EPISODE--DDD-TEXT-LIMITATION-TO-D2C
phase: 6
type: episode
status: stable
tier: process
source_type: learned
vault_id: default
title: "EPISODE — Realizing DDD Text Limitations & Discovery of D2C"
tags:
  - workflow
  - learnings
  - diagram-to-code
  - doc-driven
version: 1.0.0
enforcement_state: active
aliases:
  - EPISODE--DDD-TEXT-LIMITATION-TO-D2C
created_at: 2026-06-02T19:25:00+07:00
created_by: "system"
last_updated: "2026-06-02T19:40:00+07:00"
delivered_from: "agent"
---

# 📖 EPISODE--DDD-TEXT-LIMITATION-TO-D2C

## 1. Context & The Trigger (บริบทและจุดชนวน)
ในขณะที่พัฒนาโค้ดโดยใช้แนวคิด **Doc-Driven Development (DDD)** เราเขียนสเปกตัวอักษรเพื่ออธิบาย Business Logic แต่เมื่อโครงสร้างระบบเริ่มซับซ้อนขึ้น พบว่า:
*   เอกสารตัวหนังสือล้วนไม่สามารถแสดงผลการไหลของข้อมูล (Data Flow) หรือความสัมพันธ์เชิงโครงสร้างของ Component ได้อย่างชัดเจน
*   ส่งผลให้ Agent และผู้พัฒนายังคงสับสนในขั้นตอนการเชื่อมโยงระบบ

## 2. The Quest & Synthesis (การหาทางออก)
เราพยายามหาโซลูชันที่จะแปลง "ภาพแผนผังการออกแบบ" ให้ออกมาเป็นโค้ดได้โดยตรงเพื่อลดขั้นตอนการเขียนคำบรรยายยาวๆ 
*   **v1.0 (Local Synthesis):** เกิดความเข้าใจและไอเดียคิดค้นกระบวนการสร้างโค้ดจากภาพวาด (Visual Scaffolding)
*   **v2.0 (Discovery & Refinement):** เมื่อนำไปสืบค้นข้อมูลเชิงทฤษฎีในวงกว้าง พบว่าแนวคิดนี้ได้รับการยอมรับและมีอยู่แล้วในสากลในชื่อ **Diagram-to-Code (D2C)** จึงทำการนำแนวคิดนี้มาปรับปรุงและจัดระเบียบ (Refine) ให้เข้ากับสถาปัตยกรรม GKS ของเรา
