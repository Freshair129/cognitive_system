---
id: RUNBOOK--CONTEXT-RESOLUTION-LOOP
phase: 6
type: runbook
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "Hierarchical Context Resolution Loop"
summary: คู่มือปฏิบัติการมาตรฐาน (SOP) สำหรับ Agent เพื่อตั้งค่าขอบเขตการดึง Context ตามหลักการ H0-H5 ก่อนลงมือปฏิบัติงาน
tags:
  - runbook
  - agent-sop
  - execution-loop
created_at: 2026-06-02T20:13:00.000+07:00
cluster: ops
role: Operational response guide
crosslinks:
  references:
    - "FRAMEWORK--WORKFLOW-DYNAMICS"
    - "FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS"
  implements:
    - "MASTER--AGENT-EXECUTION-POLICY"
  parent_blueprint:
    - "GENESIS--COGNITIVE-ENGINE"
---
# 📚 RUNBOOK--CONTEXT-RESOLUTION-LOOP

**Hierarchical Context Resolution Loop**
คู่มือปฏิบัติงานมาตรฐาน (SOP) สำหรับบังคับพฤติกรรมของ AI Agent ในการจำกัดวงข้อมูล (Context Isolation) 

## **1. Trigger (เงื่อนไขการเริ่มทำงาน)**
*   **ทุกครั้ง** ที่ Agent ได้รับคำสั่งหรือ Task ใหม่จากผู้ใช้งาน
*   ก่อนที่ Agent จะรันกระบวนการย่อย เช่น `Doc-to-Code` หรือ `Diagram-to-Code`

## **2. Response Steps (ลูปขั้นตอนการทำงาน)**

### **Step 1: Identify the Workflow Phase (ประเมินกระบวนการ)**
*   **Action:** Agent สแกนคำสั่งและอ้างอิง [[FRAMEWORK--WORKFLOW-DYNAMICS]]
*   **Goal:** หาให้ได้ว่าคำสั่งนี้อยู่ในขั้นตอนไหน เช่น "นี่คืองานวางสถาปัตยกรรม (Phase 2) หรือ งานแก้บั๊กหน้างาน (Phase 5)?"

### **Step 2: Determine Scaling Tier (ล็อกขอบเขต Hop Level)**
*   **Action:** อ้างอิงตารางจาก [[FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS]]
*   **Goal:** เลือกระดับความลึก (H0 ถึง H5) ที่เหมาะสมที่สุดกับงานใน Step 1
*   *ตัวอย่าง:* หากเป็นงานแก้ปุ่ม UI ให้ Agent ล็อกตัวเองไว้ที่ **H1 (1 Hop)** ห้ามดึงข้อมูลระบบอื่นมาอ่านเด็ดขาด

### **Step 3: Just-In-Time Execution (ลงมือทำงานในพื้นที่จำกัด)**
*   **Action:** ใช้เครื่องมือค้นหาไฟล์ (หรือ Query จาก GenesisGraph) ภายใต้รัศมีที่ล็อกไว้ใน Step 2 เท่านั้น
*   **Goal:** อ่านข้อมูลที่แม่นยำที่สุด (Bespoke Context) เพื่อนำมาเขียนหรือแก้ไขโค้ด

### **Step 4: The 6-Node Verification (จุดตรวจสอบความผิดปกติ)**
*   **Action:** ระหว่างที่เขียนโค้ด หาก Agent พบว่าต้องพึ่งพาข้อมูลที่อยู่ลึกเกิน 5 Hops 
*   **Enforcement:** **หยุดทำงานทันที!** แจ้งเตือนผู้ใช้ว่าพบความเสี่ยงของการผูกขาดข้อมูลที่ผิดปกติ (Spaghetti Code / Tight Coupling) ซึ่งขัดต่อหลักการ Small World Phenomenon และเสนอให้รันกระบวนการ Refactoring แทน

## **3. Enforcement Rules**
ระเบียบปฏิบัติในลูปนี้สืบทอดมาจาก [[MASTER--AGENT-EXECUTION-POLICY]] ห้าม Agent ตัวใดละเว้นการประเมิน Hop Level ก่อนเริ่มงานเป็นอันขาด
