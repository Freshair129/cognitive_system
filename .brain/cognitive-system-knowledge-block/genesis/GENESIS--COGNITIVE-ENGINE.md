---
id: GENESIS--COGNITIVE-ENGINE
phase: 0
type: genesis
status: stable
vault_id: default
tier: master
promoted_from: GENESIS--COGNITIVE-ENGINE
promoted_at: 2026-06-02T20:13:00.000+07:00
promotion_adr: ADR--TAXONOMY-CAPABILITY-SYMMETRY
source_type: axiomatic
title: GKS Cognitive Engine Manifest
summary: Block Manifest ร่มคันใหญ่ (Runtime Entry-point) ที่ห่อหุ้มกฎเชิงนโยบาย (Master), กรอบการทำงานเชิงทฤษฎี (Framework) และคู่มือปฏิบัติการ (Runbook) สำหรับ AI Agent
tags:
  - architecture
  - genesis
  - cognitive-engine
  - manifest
created_at: "2026-06-02T19:40:00+07:00"
created_by: "system"
last_updated: "2026-06-02T19:40:00+07:00"
delivered_from: "agent"
version: 1.0.0
enforcement_state: active
aliases:
  - GENESIS--, COGNITIVE-ENGINE
cluster: implementation_flow
role: Block Manifest (v2.3+)
members:
  - "[[FRAMEWORK--WORKFLOW-DYNAMICS]]"
  - "[[FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS]]"
  - "[[RUNBOOK--CONTEXT-RESOLUTION-LOOP]]"
  - "[[CONCEPT--HYBRID-JIT-CONTEXT]]"
  - "[[CONCEPT--SPECIFICATION-TO-SYSTEM]]"
  - "[[CONCEPT--DIAGRAM-TO-CODE]]"
---

# 👑 GENESIS--COGNITIVE-ENGINE

**GKS Cognitive Engine Manifest (Runtime Entry-point)**
เอกสารบัญชีรายชื่อ (Manifest) ระดับสูงสุดที่รวบรวม "สมอง" และ "กฎเกณฑ์" ทั้งหมดที่ควบคุม AI Agent ภายใน GKS (Genesis Knowledge System) 
เอกสารนี้ทำหน้าที่เสมือนตัวบอกทิศทางให้ AI รับรู้ถึงสภาพแวดล้อม ขอบเขต และขั้นตอนการทำงานอย่างเป็นระบบ

---

## **1. Manifest Members (โครงสร้างสถาปัตยกรรมตุ๊กตาแม่ลูกดก)**

ระบบ Cognitive Engine ถูกขับเคลื่อนด้วยส่วนประกอบต่างๆ ที่ฝังอยู่ในชั้นเลเยอร์ (State Partitioning) ดังต่อไปนี้:

### 📜 1.1 Root Policy (กฎหมายแม่บทระดับสูงสุด)
กฎเหล็กระดับ Tier: Master ที่บังคับให้ Agent ต้องปฏิบัติตามก่อนตัดสินใจกระทำการใดๆ

![[MASTER--AGENT-EXECUTION-POLICY]]

### 🧠 1.2 Theoretical Frameworks (แกนทฤษฎีอ้างอิง)
เอกสารที่ระบุแนวคิดเชิงพื้นที่และเวลาของการทำงาน (ดึงข้อมูลแบบ Compound Document)

![[FRAMEWORK--WORKFLOW-DYNAMICS]]

![[FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS]]

### ⚙️ 1.3 Operational Runbooks (คู่มือปฏิบัติการหน้างาน)
คู่มือ 1-2-3-4 ที่บอกขั้นตอนการหยิบ Framework มาใช้งานจริง

![[RUNBOOK--CONTEXT-RESOLUTION-LOOP]]

### 💡 1.4 Concepts & Capabilities (แนวคิดและทักษะพิเศษ)
ทักษะหรือแนวคิดเชิงกลยุทธ์ที่ Agent ต้องใช้ตลอดช่วงวงจรชีวิตของการพัฒนา

![[CONCEPT--HYBRID-JIT-CONTEXT]]

![[CONCEPT--SPECIFICATION-TO-SYSTEM]]
* ![[CONCEPT--DOC-DRIVEN-DEVELOPMENT]]
  * ![[SKILL--DOC-TO-CODE]]
* ![[CONCEPT--DIAGRAM-TO-CODE]]
  * ![[SKILL--DIAGRAM-TO-CODE]]

---

## **2. DACI (ความรับผิดชอบ / Accountability)**
เพื่อควบคุมวงจรชีวิตของการปรับปรุงโครงสร้างสมอง AI เหล่านี้:
*   **Driver:** GKS Parser Engine (ผู้รันกระบวนการดึงข้อมูลและ Render แบบ Just-In-Time)
*   **Approver:** System Architect / System Admin (ผู้อนุมัติการปรับปรุง Framework และ Master Policy)
*   **Contributor:** AI Agents (ผู้สร้างและอัปเดต Atom ย่อยระดับ L0-L2)
*   **Informed:** Development Team (นักพัฒนาที่ใช้ระบบ GKS)
