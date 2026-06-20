---
id: CONCEPT--DOMAIN-GUIDE
phase: 1
type: concept
status: deprecated
tier: process
source_type: axiomatic
title: Domain Guide
created_at: 2026-06-02T20:13:00.000+07:00
---

﻿> **DEPRECATED (archived 2026-06-20).** Early draft superseded by the canonical
> `diagram_flow/` domain restructuring and the stable [[CONCEPT--DIAGRAM-TO-CODE]].
> Retained for history only — do not use as a live reference.

# DOMAIN: Diagram & Flow

หมวดหมู่นี้ใช้สำหรับเก็บแผนภาพ (Diagrams) และตรรกะการไหลของข้อมูล (Flows) เพื่อใช้ "ก่อนเริ่มเขียนโค้ด" แบ่งออกเป็น 3 กลุ่มหลัก:

## 1. Architecture & Data (โครงสร้างระบบและข้อมูล)
* **System Architecture Diagram:** ภาพรวมใหญ่สุด (Frontend, Backend, Database)
* **ER / Graph Schema Diagram:** โครงสร้างข้อมูล (Table/Node, Column/Props, Relations)

## 2. Behavioral & Flow (ตรรกะและการทำงาน)
* **Flowchart:** อัลกอริทึมและเงื่อนไข (If-Else)
* **Sequence Diagram:** ลำดับการส่งข้อมูลระหว่างระบบย่อย (Time & Event-driven)

## 3. Structural (โครงสร้างโค้ด)
* **Class Diagram (UML):** โครงสร้าง OOP (ไม่แนะนำให้ทำละเอียดเกินไปในเฟส Prototype)

---
**💡 MINIMALIST RULE (กระชับและจำเป็นที่สุด):**
สำหรับโปรเจกต์ขนาดเล็ก-กลาง ให้ทำแค่ 3 อย่าง:
1. System Architecture
2. ER/Graph Schema
3. Flowchart หรือ Sequence Diagram
